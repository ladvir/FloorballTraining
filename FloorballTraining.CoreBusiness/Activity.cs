using FloorballTraining.CoreBusiness.Enums;
using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness
{
    public class Activity : BaseEntity, ICloneable
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int PersonsMin { get; set; } = 1;

        public int PersonsMax { get; set; } = 30;

        public int GoaliesMin { get; set; }
        public int GoaliesMax { get; set; }

        public int DurationMin { get; set; } = 1;
        public int DurationMax { get; set; } = 60;

        public int Intensity { get; set; } = 1;

        public int Difficulty { get; set; } = 1;

        public int PlaceWidth { get; set; } = 1;

        public int PlaceLength { get; set; } = 1;

        public Environment Environment { get; set; } = Environment.Anywhere;


        public List<ActivityTag> ActivityTags { get; set; } = new();

        public List<ActivityEquipment> ActivityEquipments { get; set; } = new();

        public List<ActivityMedia> ActivityMedium { get; set; } = new();

        public List<ActivityAgeGroup> ActivityAgeGroups { get; set; } = new();

        public List<TrainingGroup> TrainingGroups { get; set; } = new();

        public void AddTag(Tag tag)
        {
            if (ActivityTags.All(at => at.Tag != tag))
            {
                ActivityTags.Add(new ActivityTag
                {
                    TagId = tag.Id,
                    Tag = tag,
                    ActivityId = Id,
                    Activity = this
                });
            }
        }

        public void AddEquipment(Equipment equipment)
        {
            if (!ActivityEquipments.Any(at => at.Equipment != null && at.Equipment?.Id == equipment.Id))
            {
                ActivityEquipments.Add(new ActivityEquipment
                {
                    EquipmentId = equipment.Id,
                    Equipment = equipment,
                    ActivityId = Id,
                    Activity = this
                });
            }
        }

        public void AddMedia(ActivityMedia media)
        {
            ActivityMedium.Add(media);
        }

        public void AddAgeGroup(AgeGroup ageGroup)
        {
            if (ActivityAgeGroups.All(at => at.AgeGroup != ageGroup))
            {
                ActivityAgeGroups.Add(new ActivityAgeGroup
                {
                    Activity = this,
                    ActivityId = Id,
                    AgeGroup = ageGroup,
                    AgeGroupId = ageGroup.Id
                });
            }
        }

        public object Clone()
        {
            return new Activity
            {
                Id = Id,
                PlaceWidth = PlaceWidth,
                PlaceLength = PlaceLength,
                Environment = Environment,
                Name = Name,
                Description = Description,
                DurationMin = DurationMin,
                DurationMax = DurationMax,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                GoaliesMin = GoaliesMin,
                GoaliesMax = GoaliesMax,
                Intensity = Intensity,
                Difficulty = Difficulty,
                ActivityTags = ActivityTags,
                ActivityEquipments = ActivityEquipments,
                ActivityMedium = ActivityMedium,
                ActivityAgeGroups = ActivityAgeGroups,
                TrainingGroups = TrainingGroups,
            };
        }

        public void Merge(Activity activity)
        {
            Name = activity.Name;
            PlaceWidth = activity.PlaceWidth;
            PlaceLength = activity.PlaceLength;
            Environment = activity.Environment;
            Description = activity.Description;
            DurationMin = activity.DurationMin;
            DurationMax = activity.DurationMax;
            PersonsMin = activity.PersonsMin;
            PersonsMax = activity.PersonsMax;
            GoaliesMin = activity.GoaliesMin;
            GoaliesMax = activity.GoaliesMax;
            Intensity = activity.Intensity;
            Difficulty = activity.Difficulty;
            ActivityTags = activity.ActivityTags;
            ActivityEquipments = activity.ActivityEquipments;
            ActivityMedium = activity.ActivityMedium;
            ActivityAgeGroups = activity.ActivityAgeGroups;
            TrainingGroups = activity.TrainingGroups;
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

        public List<ActivityMedia> GetUrls()
        {
            return ActivityMedium.Where(tp => tp.MediaType == MediaType.URL).ToList();
        }

        public List<ActivityMedia> GetImages()
        {
            return ActivityMedium.Where(tp => tp.MediaType == MediaType.Image)
               .ToList();
        }

        public List<string> GetAgeGroupNames()
        {
            return ActivityAgeGroups
                .Where(ae => ae.AgeGroup != null)
                .Select(s => s.AgeGroup!.Description).ToList();
        }


    }
}