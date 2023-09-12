using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Activity
    {
        [Key]
        [Required]
        public int ActivityId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int PersonsMin { get; set; } = 1;

        public int PersonsMax { get; set; } = 30;

        public int DurationMin { get; set; } = 1;
        public int DurationMax { get; set; } = 60;

        public int Intesity { get; set; }

        public int Difficulty { get; set; }

        public List<ActivityTag> ActivityTags { get; set; } = new();

        public List<ActivityEquipment> ActivityEquipments { get; set; } = new();

        public List<ActivityMedia> ActivityMedium { get; set; } = new();

        public List<ActivityAgeGroup> ActivityAgeGroups { get; set; } = new();

        public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new();

        public void AddTag(Tag tag)
        {
            if (!ActivityTags.Any(at => at.Tag != null && at.Tag?.TagId == tag.TagId))
            {
                ActivityTags.Add(new ActivityTag
                {
                    TagId = tag.TagId,
                    Tag = tag,
                    ActivityId = ActivityId,
                    Activity = this
                });
            }
        }

        public void AddEquipment(Equipment equipment)
        {
            if (!ActivityEquipments.Any(at => at.Equipment != null && at.Equipment?.EquipmentId == equipment.EquipmentId))
            {
                ActivityEquipments.Add(new ActivityEquipment
                {
                    EquipmentId = equipment.EquipmentId,
                    Equipment = equipment,
                    ActivityId = ActivityId,
                    Activity = this
                });
            }
        }

        public void AddMedia(Media media)
        {
            if (!ActivityMedium.Any(at => at.Media != null && at.Media == media))
            {
                ActivityMedium.Add(new ActivityMedia
                {
                    MediaId = media.MediaId,
                    Media = media,
                    ActivityId = ActivityId,
                    Activity = this
                });
            }
        }

        public void AddAgeGroup(AgeGroup ageGroup)
        {
            if (ActivityAgeGroups.All(at => at.AgeGroup != ageGroup))
            {
                ActivityAgeGroups.Add(new ActivityAgeGroup
                {
                    Activity = this,
                    ActivityId = ActivityId,
                    AgeGroup = ageGroup
                });
            }
        }

        public Activity Clone()
        {
            return new Activity
            {
                ActivityId = ActivityId,
                Name = Name,
                Description = Description,
                DurationMin = DurationMin,
                DurationMax = DurationMax,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                Intesity = Intesity,
                Difficulty = Difficulty,
                ActivityTags = ActivityTags,
                ActivityEquipments = ActivityEquipments,
                ActivityMedium = ActivityMedium,
                ActivityAgeGroups = ActivityAgeGroups
            };
        }

        public void Merge(Activity activity)
        {
            Name = activity.Name;
            Description = activity.Description;
            DurationMin = activity.DurationMin;
            DurationMax = activity.DurationMax;
            PersonsMin = activity.PersonsMin;
            PersonsMax = activity.PersonsMax;
            Intesity = activity.Intesity;
            Difficulty = activity.Difficulty;
            ActivityTags = activity.ActivityTags;
            ActivityEquipments = activity.ActivityEquipments;
            ActivityMedium = activity.ActivityMedium;
            ActivityAgeGroups = activity.ActivityAgeGroups;
        }

        public List<string?> GetEquipmentNames()
        {
            return ActivityEquipments.Where(tp => tp.Equipment != null)
                .Select(ae => ae.Equipment?.Name)
                .Distinct().ToList();
        }

        public List<string?> GetTagNames()
        {
            return ActivityTags.Where(tp => tp.Tag != null)
                .Select(ae => ae.Tag?.Name)
                .Distinct().ToList();
        }

        public List<Media?> GetUrls()
        {
            return ActivityMedium.Where(tp => tp.Media is { MediaType: MediaType.URL })
                .Select(am => am.Media).Distinct().ToList();
        }

        public List<Media?> GetImages()
        {
            return ActivityMedium.Where(tp => tp.Media is { MediaType: MediaType.Image })
                .Select(am => am.Media).Distinct().ToList();
        }

        public List<string> GetAgeGroupNames()
        {
            return ActivityAgeGroups
                .Select(ae => ae.AgeGroup.Description)
                .Distinct().ToList();
        }
    }
}