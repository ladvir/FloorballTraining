﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TagEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Tag>(dbContextFactory), ITagRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;


        public async Task<IEnumerable<Tag>> GetTagsByParentTagIdAsync(int? parentTagId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var tags = await db.Tags.Where(t => parentTagId.HasValue
                    ? t.ParentTag != null && t.ParentTag.Id == parentTagId
                    : t.ParentTag == null).ToListAsync();

            SetParentTag(tags);

            return tags;
        }

        public async Task UpdateTagAsync(Tag tag)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingTag = await db.Tags.FindAsync(tag.Id);

            existingTag!.Merge(tag);

            await db.SaveChangesAsync();
        }

        public async Task DeleteTagAsync(int tagId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var existingTag = await db.Tags.Where(a => a.Id == tagId)
                .Include(t => t.Trainings1)
                .Include(t => t.Trainings2)
                .Include(t => t.Trainings3)
                .Include(t => t.ActivityTags)
                .FirstOrDefaultAsync();

            if (existingTag == null) return;

            //activity tag
            var usedInActivities = existingTag.ActivityTags.Any();

            //training goal
            var usedInTrainings1 = existingTag.Trainings1.Any();
            var usedInTrainings2 = existingTag.Trainings2.Any();
            var usedInTrainings3 = existingTag.Trainings3.Any();

            //is parent with children
            var usedAsParents = await db.Tags.AnyAsync(a => a.ParentTag != null && (a.ParentTag.Id == existingTag.Id || a.ParentTagId == existingTag.Id));

            if (!usedInTrainings1 && !usedInTrainings2 && !usedInTrainings3 && !usedInActivities && !usedAsParents)
            {

                db.Tags.Remove(existingTag);

                await db.SaveChangesAsync();
            }
        }


        public async Task AddTagAsync(Tag tag)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            tag.ParentTagId = tag.ParentTag?.Id;
            db.Tags.Add(tag);

            if (tag.ParentTag != null)
            {
                db.Entry(tag.ParentTag).State = EntityState.Unchanged;
            }

            await db.SaveChangesAsync();
        }

        public void SetParentTag(List<Tag> tags)
        {
            foreach (var tag in tags)
            {
                tag.ParentTag = tags.FirstOrDefault(t => t.Id == tag.ParentTagId);
            }
        }


    }
}