import { Injectable } from '@nestjs/common';
import { HubsService } from '../hubs/hubs.service';

@Injectable()
export class PresenceService {
  constructor(private hubsService: HubsService) {}

  async resolveHub(lat: number, lng: number) {
    const nearest = await this.hubsService.findNearest(lat, lng);
    if (!nearest) {
      return { confidence: 'NONE', hubId: null, nearby: [] };
    }

    const nearby = await this.hubsService.listNearby(lat, lng, 5000);
    const top3 = nearby.slice(0, 3);

    if (nearest.distanceM <= nearest.radiusKm * 1000) {
      return {
        confidence: 'HIGH',
        hubId: nearest.id,
        hubName: nearest.name,
        distanceM: nearest.distanceM,
        nearby: top3,
      };
    }

    return {
      confidence: 'LOW',
      hubId: null,
      nearby: top3,
    };
  }
}
