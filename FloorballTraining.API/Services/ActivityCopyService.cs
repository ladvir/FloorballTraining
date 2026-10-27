using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Duplicates an activity with all its children: tags, equipment, age groups, skills, media
/// (drawings/images), videos (physical files are copied too) and video annotations.
/// </summary>
public interface IActivityCopyService
{
    /// <summary>Returns the new activity id, or null if the source doesn't exist.</summary>
    Task<int?> CopyAsync(int sourceId, string userId);
}

public class ActivityCopyService(FloorballTrainingContext context, IVideoFileStorage fileStorage) : IActivityCopyService
{
    public async Task<int?> CopyAsync(int sourceId, string userId)
    {
        var src = await context.Activities.AsNoTracking()
            .Include(a => a.ActivityTags)
            .Include(a => a.ActivityEquipments)
            .Include(a => a.ActivityAgeGroups)
            .Include(a => a.ActivitySkills)
            .Include(a => a.ActivityMedium)
            .AsSplitQuery()
            .FirstOrDefaultAsync(a => a.Id == sourceId);
        if (src == null) return null;

        var copy = new Activity
        {
            Name = $"{src.Name} (kopie)",
            Description = src.Description,
            PersonsMin = src.PersonsMin,
            PersonsMax = src.PersonsMax,
            GoaliesMin = src.GoaliesMin,
            GoaliesMax = src.GoaliesMax,
            DurationMin = src.DurationMin,
            DurationMax = src.DurationMax,
            Intensity = src.Intensity,
            Difficulty = src.Difficulty,
            PlaceWidth = src.PlaceWidth,
            PlaceLength = src.PlaceLength,
            Environment = src.Environment,
            IsDraft = true, // re-validated on first save of the copy
            CreatedByUserId = userId,
            // Join rows reference existing Tag/Equipment/... by FK only — never the loaded entities.
            ActivityTags = src.ActivityTags.Select(t => new ActivityTag { TagId = t.TagId }).ToList(),
            ActivityEquipments = src.ActivityEquipments.Select(e => new ActivityEquipment { EquipmentId = e.EquipmentId }).ToList(),
            ActivityAgeGroups = src.ActivityAgeGroups.Select(g => new ActivityAgeGroup { AgeGroupId = g.AgeGroupId }).ToList(),
            ActivitySkills = src.ActivitySkills.Select(s => new ActivitySkill { SkillId = s.SkillId }).ToList(),
            ActivityMedium = src.ActivityMedium.Select(m => new ActivityMedia
            {
                Path = m.Path,
                Name = m.Name,
                MediaType = m.MediaType,
                Preview = m.Preview,
                Data = m.Data,
                IsThumbnail = m.IsThumbnail,
            }).ToList(),
        };
        context.Activities.Add(copy);
        await context.SaveChangesAsync(); // need copy.Id for the video storage folder

        var videos = await context.Videos.AsNoTracking()
            .Where(v => v.ActivityId == sourceId)
            .ToListAsync();
        var videoIds = videos.Select(v => v.Id).ToList();
        var annotations = await context.VideoAnnotations.AsNoTracking()
            .Where(a => videoIds.Contains(a.VideoId))
            .ToListAsync();

        var copiedVideos = new List<(int SourceVideoId, Video Copy)>();
        foreach (var v in videos)
        {
            var newVideo = new Video
            {
                ActivityId = copy.Id,
                VideoType = v.VideoType,
                Url = v.Url,
                Title = v.Title,
                ThumbnailUrl = v.ThumbnailUrl,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
            };

            if (v.VideoType == VideoType.UploadedFile)
            {
                newVideo.FilePath = v.FilePath == null ? null : fileStorage.Copy(v.FilePath, VideoOwnerType.Activity, copy.Id);
                if (newVideo.FilePath == null) continue; // source file gone — nothing to copy
                // Uploaded-file thumbnails are stored files too; link thumbnails (YouTube...) are plain URLs.
                if (!string.IsNullOrWhiteSpace(v.ThumbnailUrl))
                    newVideo.ThumbnailUrl = fileStorage.Copy(v.ThumbnailUrl, VideoOwnerType.Activity, copy.Id);
            }

            context.Videos.Add(newVideo);
            copiedVideos.Add((v.Id, newVideo));
        }
        await context.SaveChangesAsync();

        foreach (var (sourceVideoId, newVideo) in copiedVideos)
        {
            var ann = annotations.FirstOrDefault(a => a.VideoId == sourceVideoId);
            if (ann == null) continue;
            // Burned-in export is not carried over — it can be re-run on the copy.
            context.VideoAnnotations.Add(new VideoAnnotation
            {
                VideoId = newVideo.Id,
                TrimStartMs = ann.TrimStartMs,
                TrimEndMs = ann.TrimEndMs,
                DataJson = ann.DataJson,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
            });
        }
        await context.SaveChangesAsync();

        return copy.Id;
    }
}
