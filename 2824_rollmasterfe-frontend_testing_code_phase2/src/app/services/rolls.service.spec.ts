import { TestBed } from '@angular/core/testing';

import { RollsService } from './rolls.service';

describe('RollsService', () => {
  let service: RollsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RollsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
