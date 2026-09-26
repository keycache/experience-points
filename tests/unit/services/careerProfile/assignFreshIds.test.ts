import { describe, expect, it } from 'vitest';
import { assignFreshIds } from '../../../../src/services/career-profile/assignFreshIds';
import { buildValidCareerProfile } from '../../schemas/fixtures';

describe('assignFreshIds', () => {
  it('replaces experience, project, and accomplishment ids with fresh values', () => {
    const profile = buildValidCareerProfile();
    const originalExperienceId = profile.experience[0].id;
    const originalProjectId = profile.experience[0].projects[0].id;
    const originalAccomplishmentId = profile.experience[0].projects[0].accomplishments[0].id;

    const refreshed = assignFreshIds(profile);

    expect(refreshed.experience[0].id).not.toBe(originalExperienceId);
    expect(refreshed.experience[0].projects[0].id).not.toBe(originalProjectId);
    expect(refreshed.experience[0].projects[0].accomplishments[0].id).not.toBe(
      originalAccomplishmentId,
    );
  });

  it('replaces skill and education ids', () => {
    const profile = buildValidCareerProfile();
    const originalSkillId = profile.skills[0].id;
    const originalEducationId = profile.education[0].id;

    const refreshed = assignFreshIds(profile);

    expect(refreshed.skills[0].id).not.toBe(originalSkillId);
    expect(refreshed.education[0].id).not.toBe(originalEducationId);
  });

  it('preserves all non-id data unchanged', () => {
    const profile = buildValidCareerProfile();

    const refreshed = assignFreshIds(profile);

    expect(refreshed.experience[0].company).toBe(profile.experience[0].company);
    expect(refreshed.experience[0].projects[0].accomplishments[0].description).toBe(
      profile.experience[0].projects[0].accomplishments[0].description,
    );
    expect(refreshed.personal).toEqual(profile.personal);
  });

  it('produces unique ids across all items in a profile with multiple entries', () => {
    const profile = buildValidCareerProfile();
    profile.experience.push({ ...profile.experience[0], id: 'exp-2' });

    const refreshed = assignFreshIds(profile);
    const allIds = [refreshed.experience[0].id, refreshed.experience[1].id];

    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
