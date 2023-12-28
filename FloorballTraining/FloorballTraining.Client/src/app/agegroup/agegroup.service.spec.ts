import { TestBed } from '@angular/core/testing';

import { AgegroupService } from './agegroup.service';

describe('AgegroupService', () => {
  let service: AgegroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgegroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
