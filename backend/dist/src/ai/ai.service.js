"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const insights_service_1 = require("../insights/insights.service");
const supabase_service_1 = require("../supabase/supabase.service");
const governance_service_1 = require("../governance/governance.service");
const algorand_service_1 = require("../finance/algorand.service");
const common_2 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let AiService = class AiService {
    prisma;
    insights;
    supabase;
    governance;
    algorand;
    constructor(prisma, insights, supabase, governance, algorand) {
        this.prisma = prisma;
        this.insights = insights;
        this.supabase = supabase;
        this.governance = governance;
        this.algorand = algorand;
    }
    async draftSponsorMessage(eventId, sponsorId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { club: true },
        });
        const sponsor = await this.prisma.sponsor.findUnique({
            where: { id: sponsorId },
        });
        if (!event || !sponsor) {
            throw new Error('Event or Sponsor not found');
        }
        const prompt = `
      Write a professional sponsorship outreach email for the following:
      - Club Name: ${event.club.name}
      - Event Name: ${event.title}
      - Event Date: ${event.date.toLocaleDateString()}
      - Event Venue: ${event.venue}
      - Expected Footfall: ${event.capacity} students
      - Sponsor Organization: ${sponsor.organization}
      - Sponsor Contact Person: ${sponsor.name}

      The email should:
      - Be formal and concise (max 150 words)
      - Mention the sponsorship opportunity clearly
      - Highlight audience size and visibility benefits
      - End with a call to action
      - Include a subject line at the top in format: Subject: <subject>

      Return only the email text, nothing else.
    `;
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
        try {
            const response = await fetch(ollamaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3',
                    prompt,
                    stream: false,
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }
            const data = await response.json();
            const fullText = data.response || '';
            const subjectMatch = fullText.match(/Subject:\s*(.+)/i);
            const subject = subjectMatch
                ? subjectMatch[1].trim()
                : `Sponsorship Opportunity: ${event.title}`;
            const message = fullText.replace(/Subject:\s*.+\n?/i, '').trim();
            return { subject, message };
        }
        catch (error) {
            console.error('Ollama call failed, using fallback template:', error);
            return {
                subject: `Sponsorship Opportunity: ${event.title}`,
                message: `Dear ${sponsor.name},\n\nWe at ${event.club.name} are hosting "${event.title}" on ${event.date.toLocaleDateString()} at ${event.venue}.\n\nWe are expecting ${event.capacity} students and would love to have ${sponsor.organization} as our sponsor.\n\nWould you be available for a brief call to discuss this further?\n\nBest Regards,\nThe Team at ${event.club.name}`,
            };
        }
    }
    async generatePosterBackground(prompt) {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) {
            console.warn('No HUGGINGFACE_API_KEY found, using fallback image');
            const keyword = prompt.split(' ')[0] || 'college';
            return {
                imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)},abstract,event`,
                source: 'fallback',
            };
        }
        const enhancedPrompt = `${prompt}, highly detailed, aesthetic poster background, 
      vibrant colors, professional event design, 4k resolution, 
      cinematic lighting, no text, no watermarks`;
        try {
            const response = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: enhancedPrompt,
                    parameters: {
                        negative_prompt: 'text, watermark, blurry, low quality, distorted, ugly',
                        num_inference_steps: 30,
                        guidance_scale: 7.5,
                        width: 768,
                        height: 512,
                    },
                }),
            });
            if (response.status === 503) {
                const errorBody = await response.json();
                const waitTime = errorBody?.estimated_time || 20;
                throw new Error(`Model is loading, estimated wait: ${waitTime}s. Try again shortly.`);
            }
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hugging Face API error: ${response.status} — ${errorText}`);
            }
            const imageBuffer = await response.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;
            return { imageUrl, source: 'stable-diffusion-xl' };
        }
        catch (error) {
            console.error('Poster generation failed:', error);
            const keyword = prompt.split(' ')[0] || 'event';
            return {
                imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)},abstract`,
                source: 'fallback',
                error: error.message,
            };
        }
    }
    async generateEventPoster(eventId, options) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId },
            include: {
                club: {
                    select: {
                        name: true,
                        category: true,
                    },
                },
            },
        });
        if (!event) {
            throw new Error('Event not found');
        }
        const prompt = [
            `Create a poster-ready event background for "${event.title}"`,
            `club: ${event.club.name}`,
            `venue: ${event.venue}`,
            options?.mood ? `visual mood: ${options.mood}` : null,
            options?.tagline ? `tagline inspiration: ${options.tagline}` : null,
            'high contrast composition, campus event design, no text baked into the image',
        ]
            .filter(Boolean)
            .join(', ');
        const poster = await this.generatePosterBackground(prompt);
        const persistedImageUrl = await this.persistPosterAsset(event.id, poster.imageUrl);
        await this.prisma.event.update({
            where: { id: event.id },
            data: {
                posterPrompt: prompt,
                posterImageUrl: persistedImageUrl,
            },
        });
        await this.insights.recordSyncEvent({
            entityType: 'poster',
            action: 'generated',
            entityId: event.id,
            payload: {
                source: poster.source,
            },
        });
        return {
            ...poster,
            imageUrl: persistedImageUrl,
            prompt,
        };
    }
    async generatePosterCopySuggestions(eventId, options) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId },
            include: {
                club: {
                    select: {
                        name: true,
                        category: true,
                        coordinator: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!event) {
            throw new common_2.BadRequestException('Event not found');
        }
        const fallback = this.getPosterCopyFallback(event, options?.currentFields);
        const prompt = `
      You are designing a hackathon/event poster copy deck for a college event.
      Return ONLY valid JSON. No markdown. No commentary.

      Event details:
      - Title: ${event.title}
      - Category: ${event.category || 'Campus Event'}
      - Club: ${event.club.name}
      - Description: ${event.description}
      - Date: ${event.date.toLocaleDateString()}
      - Time: ${event.date.toLocaleTimeString()}
      - Venue: ${event.venue}
      - Capacity: ${event.capacity}
      - Mood: ${options?.mood || 'high-energy, cinematic'}

      Existing user inputs:
      ${JSON.stringify(options?.currentFields || {}, null, 2)}

      Generate concise, high-impact poster copy inspired by modern college hackathon posters.
      Use short phrases, strong CTA wording, and realistic content.

      Required JSON keys:
      posterTitle
      subtitle
      registrationBanner
      aboutText
      prizePool
      dayPrizePool
      registrationFee
      teamSize
      eligibility
      dateLabel
      timeLabel
      venueLabel
      website
      coordinatorName
      coordinatorPhone
      studentCoordinator
      studentPhone
      sponsors
      benefits
    `;
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
        try {
            const response = await fetch(ollamaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3',
                    prompt,
                    stream: false,
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }
            const data = await response.json();
            const rawText = data.response || '';
            const parsed = this.extractJsonObject(rawText);
            return {
                ...fallback,
                ...parsed,
            };
        }
        catch (error) {
            console.error('Poster copy generation failed, using fallback:', error);
            return fallback;
        }
    }
    async generateGuestCertificates(eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                registrations: {
                    where: { attended: true },
                    include: { user: true },
                },
                club: true,
            },
        });
        if (!event)
            throw new Error('Event not found');
        if (event.registrations.length === 0) {
            return { count: 0, status: 'no_attendees' };
        }
        const results = [];
        for (const reg of event.registrations) {
            try {
                const certPrompt = `
          professional certificate of participation background, 
          elegant design, gold border, ${event.club.name} theme,
          formal academic style, no text, clean layout
        `;
                const { imageUrl } = await this.generatePosterBackground(certPrompt);
                await this.prisma.registration.update({
                    where: { id: reg.id },
                    data: { certificateUrl: imageUrl },
                });
                results.push({ name: reg.user.name, certificateUrl: imageUrl });
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            catch (err) {
                console.error(`Certificate generation failed for ${reg.user.name}:`, err);
            }
        }
        return {
            count: results.length,
            status: 'certificates_completed',
            certificates: results,
        };
    }
    async checkOllamaHealth() {
        try {
            const response = await fetch(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/tags`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async getAssistantContext() {
        return this.insights.getAssistantContext();
    }
    async chatWithAssistant(userId, prompt, history = []) {
        const collegeId = this.insights.getCurrentCollegeIdOrThrow();
        const context = await this.insights.getAssistantContext();
        const systemPrompt = `
      You are the "Campus Club AI Chief of Staff", an expert data-driven assistant for college clubs.
      You have access to the following real-time metric context for the current college:
      ${JSON.stringify(context, null, 2)}

      Your job is to answer the user's question, summarize data, or give strategic advice.
      Keep your answer concise, engaging, and highly specific to the provided metrics.

      ** IMPORTANT INSTRUCTION FOR SUGGESTIONS **
      If the user specifically asks you to suggest an action (or you strongly recommend one based on data), you must output a JSON block at the very end of your response, wrapped exactly in \`\`\`json ... \`\`\`.
      
      Supported Actions:
      1. CREATE_PROPOSAL
         Format required in JSON payload: { "title": "...", "description": "...", "amount": number, "timelockHours": number, "eventId": "matched_from_context" }
      2. MINT_TOKEN
         Format required in JSON payload: { "category": 7, "walletAddress": "target_user_wallet", "reason": "why they deserve it" }

      You must only output the JSON block if an action is strongly warranted or requested. Otherwise, just output normal text.
    `;
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: prompt },
        ];
        let fullText = '';
        try {
            const response = await fetch(ollamaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3',
                    messages,
                    stream: false,
                }),
            });
            if (!response.ok)
                throw new Error(`Ollama error: ${response.statusText}`);
            const data = await response.json();
            fullText = data.message?.content || '';
        }
        catch (error) {
            console.error('Ollama chat failed:', error);
            throw new common_2.BadRequestException('AI is currently unavailable. Ensure Ollama is running.');
        }
        let reply = fullText;
        let suggestedAction = null;
        const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                const potentialAction = JSON.parse(jsonMatch[1]);
                if (potentialAction.type && potentialAction.payload) {
                    suggestedAction = potentialAction;
                }
            }
            catch (e) {
            }
            reply = fullText.replace(/```json\n[\s\S]*?\n```/, '').trim();
        }
        await this.insights.recordSyncEvent({
            entityType: 'system',
            action: suggestedAction ? 'suggestion_provided' : 'chatted',
            entityId: userId,
            payload: { prompt, suggestedActionType: suggestedAction?.type },
        });
        return { reply, suggestedAction };
    }
    async executeSuggestedAction(userId, type, payload) {
        const collegeId = this.insights.getCurrentCollegeIdOrThrow();
        if (type === 'CREATE_PROPOSAL') {
            if (!payload.eventId) {
                throw new common_2.BadRequestException('eventId is required to create a proposal.');
            }
            return this.governance.createProposal({
                proposerId: userId,
                eventId: payload.eventId,
                title: payload.title || 'AI Suggested Proposal',
                description: payload.description || 'Generated by AI Chief of Staff',
                spendAmount: payload.amount || 0,
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            });
        }
        if (type === 'MINT_TOKEN') {
            if (!payload.walletAddress) {
                throw new common_2.BadRequestException('walletAddress is required for minting.');
            }
            const categoryMap = {
                7: client_1.CollegeContractType.ENTRY_TOKEN,
            };
            const contractType = categoryMap[payload.category || 7];
            if (!contractType)
                throw new common_2.BadRequestException('Unsupported token category.');
            return this.algorand.triggerLifecycleAction({
                action: client_1.BlockchainActionType.MINT,
                contractType,
                entityId: userId,
                walletAddress: payload.walletAddress,
                metadata: {
                    reason: payload.reason || 'AI Chief of Staff recommendation',
                    source: 'ai_studio',
                },
            });
        }
        throw new common_2.BadRequestException('Unknown action type.');
    }
    async persistPosterAsset(eventId, imageUrl) {
        if (!imageUrl.startsWith('data:image/')) {
            return imageUrl;
        }
        try {
            const [, mimeType, data] = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/) || [];
            if (!mimeType || !data) {
                return imageUrl;
            }
            const extension = mimeType.split('/')[1] || 'png';
            const path = `${this.insights.getCurrentCollegeIdOrThrow()}/events/${eventId}/poster.${extension}`;
            const client = this.supabase.getClient();
            const bytes = Buffer.from(data, 'base64');
            await client.storage
                .from(process.env.SUPABASE_POSTER_BUCKET || 'ai-posters')
                .upload(path, bytes, {
                contentType: mimeType,
                upsert: true,
            });
            const { data: publicUrlData } = client.storage
                .from(process.env.SUPABASE_POSTER_BUCKET || 'ai-posters')
                .getPublicUrl(path);
            return publicUrlData.publicUrl || imageUrl;
        }
        catch (error) {
            console.warn('Supabase poster upload failed, using raw image data', error);
            return imageUrl;
        }
    }
    extractJsonObject(rawText) {
        const fencedMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
        const candidate = fencedMatch ? fencedMatch[1] : rawText;
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) {
            throw new Error('No JSON object found in AI response');
        }
        return JSON.parse(candidate.slice(start, end + 1));
    }
    getPosterCopyFallback(event, currentFields) {
        return {
            posterTitle: currentFields?.posterTitle || event.title,
            subtitle: currentFields?.subtitle ||
                (event.category ? `${event.category} Showdown` : 'Code Together. Win Together.'),
            registrationBanner: currentFields?.registrationBanner || 'Registrations open now',
            aboutText: currentFields?.aboutText ||
                event.description ||
                `Join ${event.club.name} for a high-energy campus experience built for creators, problem-solvers, and future leaders.`,
            prizePool: currentFields?.prizePool || '50,000',
            dayPrizePool: currentFields?.dayPrizePool || '10K+ in prizes',
            registrationFee: currentFields?.registrationFee || '149',
            teamSize: currentFields?.teamSize || '1 to 4 Students',
            eligibility: currentFields?.eligibility || 'Open to all branches & all years',
            dateLabel: currentFields?.dateLabel ||
                event.date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
            timeLabel: currentFields?.timeLabel ||
                event.date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            venueLabel: currentFields?.venueLabel || event.venue,
            website: currentFields?.website || 'Register on CampusClubs',
            coordinatorName: currentFields?.coordinatorName || event.club.coordinator?.name || 'Faculty Coordinator',
            coordinatorPhone: currentFields?.coordinatorPhone || '+91 9000000000',
            studentCoordinator: currentFields?.studentCoordinator || 'Student Coordinator',
            studentPhone: currentFields?.studentPhone || '+91 9000000001',
            sponsors: currentFields?.sponsors || 'Title Sponsor\nCommunity Partner\nHospitality Partner',
            benefits: currentFields?.benefits ||
                'Exciting prize opportunities\nInternship and career exposure\nCertificates to boost your profile\nGreat networking and goodies',
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        insights_service_1.InsightsService,
        supabase_service_1.SupabaseService,
        governance_service_1.GovernanceService,
        algorand_service_1.AlgorandService])
], AiService);
//# sourceMappingURL=ai.service.js.map