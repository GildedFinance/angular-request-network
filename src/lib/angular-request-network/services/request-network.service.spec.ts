import { TestBed, inject } from '@angular/core/testing';
import { RequestNetworkService } from './request-network.service';

describe('RequestNetworkService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RequestNetworkService]
    });
  });

  it('should be created', inject([RequestNetworkService], (service: RequestNetworkService) => {
    expect(service).toBeTruthy();
  }));
});
