import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async draftSponsorMessage(eventId: string, sponsorId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, include: { club: true } });
    const sponsor = await this.prisma.sponsor.findUnique({ where: { id: sponsorId } });

    if (!event || !sponsor) throw new Error("Event or Sponsor not found");

    // In a real scenario, this would post to a local Ollama instance on http://localhost:11434/api/generate
    // e.g. await fetch('http://localhost:11434/api/generate', { model: 'llama3', prompt: `Draft email...` })
    
    return {
      subject: `Sponsorship Opportunity: ${event.title}`,
      message: `Dear ${sponsor.name},\n\nWe at ${event.club.name} are hosting an exciting event "${event.title}" on ${event.date.toLocaleDateString()} at ${event.venue}.\n\nGiven ${sponsor.organization}'s esteemed position, we would love to invite you to sponsor our event. We are expecting a footfall of ${event.capacity} students.\n\nLooking forward to your response.\n\nBest Regards,\nThe Team at ${event.club.name}`
    };
  }

  async generatePosterBackground(prompt: string) {
    // In a real scenario, this connects to Hugging Face Inference API / Stable Diffusion Local
    // e.g. await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', { ... })
    
    // Fallback Mock: returning an Unsplash source URL that matches the theme
    const keyword = prompt.split(' ')[0] || 'college';
    return { imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)},abstract,event` };
  }

  async generateGuestCertificates(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: { where: { attended: true, user: { role: 'GUEST' } }, include: { user: true } },
        club: true,
      },
    });

    if (!event) return;

    // Simulate AI generation for each guest
    for (const reg of event.registrations) {
      console.log(`Generating AI Thank-You Certificate for guest: ${reg.user.name} for event: ${event.title}`);
      
      const certificateUrl = `https://source.unsplash.com/800x600/?diploma,certificate,appreciation,${event.club.name.toLowerCase().replace(/ /g, ',')}`;
      
      await this.prisma.registration.update({
        where: { id: reg.id },
        data: { certificateUrl }
      });
    }

    return { count: event.registrations.length, status: 'certificates_completed' };
  }
}
