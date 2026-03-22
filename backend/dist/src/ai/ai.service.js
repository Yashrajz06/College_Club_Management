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
let AiService = class AiService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map