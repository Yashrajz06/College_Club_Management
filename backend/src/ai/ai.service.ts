import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsightsService } from '../insights/insights.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GovernanceService } from '../governance/governance.service';
import { AlgorandService } from '../finance/algorand.service';
import { BadRequestException } from '@nestjs/common';
import { BlockchainActionType, CollegeContractType } from '@prisma/client';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private readonly insights: InsightsService,
    private readonly supabase: SupabaseService,
    private readonly governance: GovernanceService,
    private readonly algorand: AlgorandService,
  ) { }

  // ─────────────────────────────────────────────
  // 1. SPONSOR OUTREACH — actual Ollama call
  // ─────────────────────────────────────────────
  async draftSponsorMessage(eventId: string, sponsorId: string) {
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

    const ollamaUrl =
      process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';

    try {
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt,
          stream: false, // get full response at once
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      const fullText: string = data.response || '';

      // Parse subject line from response
      const subjectMatch = fullText.match(/Subject:\s*(.+)/i);
      const subject = subjectMatch
        ? subjectMatch[1].trim()
        : `Sponsorship Opportunity: ${event.title}`;

      // Remove the subject line from the message body
      const message = fullText.replace(/Subject:\s*.+\n?/i, '').trim();

      return { subject, message };

    } catch (error) {
      console.error('Ollama call failed, using fallback template:', error);

      // Fallback template if Ollama is not running
      return {
        subject: `Sponsorship Opportunity: ${event.title}`,
        message: `Dear ${sponsor.name},\n\nWe at ${event.club.name} are hosting "${event.title}" on ${event.date.toLocaleDateString()} at ${event.venue}.\n\nWe are expecting ${event.capacity} students and would love to have ${sponsor.organization} as our sponsor.\n\nWould you be available for a brief call to discuss this further?\n\nBest Regards,\nThe Team at ${event.club.name}`,
      };
    }
  }

  // ─────────────────────────────────────────────
  // 2. POSTER BACKGROUND — corrected HF model
  // ─────────────────────────────────────────────
  async generatePosterBackground(prompt: string) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    // Fallback if no API key
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
      // Use SDXL — most capable free model on HF inference API
      const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
              negative_prompt:
                'text, watermark, blurry, low quality, distorted, ugly',
              num_inference_steps: 30,
              guidance_scale: 7.5,
              width: 768,
              height: 512,
            },
          }),
        },
      );

      // HF returns 503 when model is loading
      if (response.status === 503) {
        const errorBody = await response.json();
        const waitTime = errorBody?.estimated_time || 20;
        throw new Error(
          `Model is loading, estimated wait: ${waitTime}s. Try again shortly.`,
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API error: ${response.status} — ${errorText}`);
      }

      // HF returns raw image binary — convert to base64
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      return { imageUrl, source: 'stable-diffusion-xl' };

    } catch (error) {
      console.error('Poster generation failed:', error);

      // Graceful fallback
      const keyword = prompt.split(' ')[0] || 'event';
      return {
        imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)},abstract`,
        source: 'fallback',
        error: error.message,
      };
    }
  }

  async generateEventPoster(eventId: string, options?: { mood?: string; tagline?: string }) {
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
    const persistedImageUrl = await this.persistPosterAsset(
      event.id,
      poster.imageUrl,
    );

    // @ts-ignore
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

  // ─────────────────────────────────────────────
  // 3. GUEST CERTIFICATES — proper implementation
  // ─────────────────────────────────────────────
  async generateGuestCertificates(eventId: string) {
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

    if (!event) throw new Error('Event not found');
    if (event.registrations.length === 0) {
      return { count: 0, status: 'no_attendees' };
    }

    const results: { name: string; certificateUrl: string }[] = [];

    for (const reg of event.registrations) {
      try {
        // Build a prompt for a certificate-style background
        const certPrompt = `
          professional certificate of participation background, 
          elegant design, gold border, ${event.club.name} theme,
          formal academic style, no text, clean layout
        `;

        // Generate AI certificate background
        const { imageUrl } = await this.generatePosterBackground(certPrompt);

        // Save certificate URL back to registration
        await this.prisma.registration.update({
          where: { id: reg.id },
          data: { certificateUrl: imageUrl },
        });

        results.push({ name: reg.user.name, certificateUrl: imageUrl });

        // Small delay between HF API calls to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(
          `Certificate generation failed for ${reg.user.name}:`,
          err,
        );
      }
    }

    return {
      count: results.length,
      status: 'certificates_completed',
      certificates: results,
    };
  }

  // ─────────────────────────────────────────────
  // 4. HELPER — check if Ollama is running
  // ─────────────────────────────────────────────
  async checkOllamaHealth(): Promise<boolean> {
    try {
      const response = await fetch(
        `${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/tags`,
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAssistantContext() {
    return this.insights.getAssistantContext();
  }

  // ─────────────────────────────────────────────
  // 5. AI CHAT ASSISTANT
  // ─────────────────────────────────────────────
  async chatWithAssistant(
    userId: string,
    prompt: string,
    history: { role: string; content: string }[] = [],
  ) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();

    // Fetch the enriched College context
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

      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);

      const data = await response.json();
      fullText = data.message?.content || '';
    } catch (error) {
      console.error('Ollama chat failed:', error);
      throw new BadRequestException('AI is currently unavailable. Ensure Ollama is running.');
    }

    // Parse actionable JSON if present
    let reply = fullText;
    let suggestedAction = null;

    const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const potentialAction = JSON.parse(jsonMatch[1]);
        if (potentialAction.type && potentialAction.payload) {
          suggestedAction = potentialAction;
        }
      } catch (e) {
        // parsing failed, ignore suggestion
      }
      reply = fullText.replace(/```json\n[\s\S]*?\n```/, '').trim();
    }

    // Log the interaction
    await this.insights.recordSyncEvent({
      entityType: 'system' as any,
      action: suggestedAction ? 'suggestion_provided' : 'chatted',
      entityId: userId, // use userId to track who asked
      payload: { prompt, suggestedActionType: suggestedAction?.type },
    });

    return { reply, suggestedAction };
  }

  // ─────────────────────────────────────────────
  // 6. EXECUTE SCRIPT ACTION
  // ─────────────────────────────────────────────
  async executeSuggestedAction(userId: string, type: 'CREATE_PROPOSAL' | 'MINT_TOKEN', payload: any) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();

    if (type === 'CREATE_PROPOSAL') {
      if (!payload.eventId) {
        throw new BadRequestException('eventId is required to create a proposal.');
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
        throw new BadRequestException('walletAddress is required for minting.');
      }
      
      const categoryMap: Record<number, CollegeContractType> = {
        7: CollegeContractType.ENTRY_TOKEN,
      };
      
      const contractType = categoryMap[payload.category || 7];
      if (!contractType) throw new BadRequestException('Unsupported token category.');

      return this.algorand.triggerLifecycleAction({
        action: BlockchainActionType.MINT,
        contractType,
        entityId: userId,
        walletAddress: payload.walletAddress,
        metadata: {
          reason: payload.reason || 'AI Chief of Staff recommendation',
          source: 'ai_studio',
        },
      });
    }

    throw new BadRequestException('Unknown action type.');
  }

  private async persistPosterAsset(eventId: string, imageUrl: string) {
    if (!imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }

    try {
      const [, mimeType, data] =
        imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/) || [];

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
    } catch (error) {
      console.warn('Supabase poster upload failed, using raw image data', error);
      return imageUrl;
    }
  }
}
