using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;
using TrainingDataAccess.Dtos;
using TrainingDataAccess.Services.ActivityServices;

namespace TrainingDataAccess.Models
{
    [Table("Activities")]
    public class Activity
    {
        [Key][Required] public int ActivityId { get; private set; }

        public string Name { get; private set; } = string.Empty;
        public string? Description { get; private set; }
        public int? PersonsMin { get; private set; }
        public int? PersonsMax { get; private set; }
        public int? DurationMin { get; private set; }
        public int? DurationMax { get; private set; }
        public List<Tag> Tags { get; private set; } = new List<Tag>();


        //public List<TrainingPart> TrainingParts { get; set; } = new List<TrainingPart>();

        /* EF Relations */
        public List<ActivityTag> ActivityTags { get; set; } = new List<ActivityTag>();
        //public List<TrainingPartActivity> TrainingPartActivities { get; set; }



        public Activity()
        {
        }

        public static Activity Create(Activity activity)
        {
            var activityNew = new Activity
            {
                ActivityId = activity.ActivityId,
                Name = activity.Name,
                Description = activity.Description,
                PersonsMax = activity.PersonsMax,
                Tags = new List<Tag>(activity.Tags),
                PersonsMin = activity.PersonsMin,
                DurationMin = activity.DurationMin,
                DurationMax = activity.DurationMax
            };
            return activityNew;
        }

        public static Activity Create(int activityId, string name, string? description, int? personsMin,
            int? personsMax, int? durationMin, int? durationMax)
        {
            var activity = new Activity();
            activity.Initialize(activityId, name, description, personsMin, personsMax, durationMin, durationMax);
            return activity;
        }



        public virtual void Initialize(int activityId, string name, string? description, int? personsMin,
            int? personsMax, int? durationMin, int? durationMax)
        {
            ActivityId = activityId;
            Name = name;
            Description = description;
            PersonsMax = personsMax;
            PersonsMin = personsMin;
            DurationMin = durationMin;
            DurationMax = durationMax;
        }

        public void AddTags(List<Tag> tags)
        {
            Tags ??= new List<Tag>();
            Tags.AddRange(tags);
        }

        public void AddTag(Tag tag)
        {
            Tags ??= new List<Tag>();
            Tags.Add(tag);
        }


        public static Expression<Func<Activity, bool>> ContainsInDescription(
            params string[] keywords)
        {
            var keywordsList = keywords.Where(k => !string.IsNullOrEmpty(k)).ToList();

            var predicate = keywordsList.Any() ? PredicateBuilder.False<Activity>() : PredicateBuilder.True<Activity>();

            foreach (var keyword in keywordsList)
            {
                predicate = predicate.Or(p => p.Name.Contains(keyword));
                predicate = predicate.Or(p => p.Description != null && p.Description.Contains(keyword));
                predicate = predicate.Or(p => p.Tags.Any(t => t.Name != null && t.Name.Contains(keyword)));
            }

            return predicate;
        }
    }


    public interface IFactory<T, TDto>
        where T : class
        where TDto : class
    {
        T GetMergedOrBuild(TDto dto);
        T Build(TDto dto);
    }


    public interface IActivityFactory : IFactory<Activity, ActivityDto>
    {
    }

    public interface ITagFactory : IFactory<Tag, TagDto>
    {
    }

    public class TagFactory : ITagFactory
    {
        public Tag GetMergedOrBuild(TagDto dto)
        {
            throw new NotImplementedException();
        }

        public Tag Build(TagDto dto)
        {
            var tag = new Tag();
            tag.Initialize(dto.TagId, dto.Name, dto.ParentTagId, dto.Color);

            return tag;
        }
    }

    public class ActivityFactory : IActivityFactory
    {
        public Activity GetMergedOrBuild(ActivityDto dto)
        {
            throw new NotImplementedException();
        }

        public Activity Build(ActivityDto dto)
        {
            var activity = new Activity();
            activity.Initialize(dto.ActivityId, dto.Name, dto.Description, dto.PersonsMin, dto.PersonsMax, dto.DurationMin, dto.DurationMax);
            return activity;
        }
    }


}