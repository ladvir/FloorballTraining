﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;
using TrainingDataAccess.Services.ActivityServices;

namespace TrainingDataAccess.Models
{
    [Table("Activities")]
    public class Activity
    {
        [Key]
        [Required]
        public int ActivityId { get; private set; }

        public string Name { get; private set; } = string.Empty;
        public string? Description { get; private set; } = string.Empty;
        public int? PersonsMin { get; private set; }
        public int? PersonsMax { get; private set; }
        public int? DurationMin { get; private set; }
        public int? DurationMax { get; private set; }



        public List<ActivityTag> ActivityTags { get; set; } = new List<ActivityTag>();

        public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new List<TrainingGroupActivity>();

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

        public void AddActivityTag(ActivityTag activityTag)
        {
            ActivityTags.Add(activityTag);
        }

        public static Expression<Func<Activity, bool>> Contains(params string[] keywords)
        {
            var keywordsList = keywords.Where(k => !string.IsNullOrEmpty(k)).ToList();

            var predicate = keywordsList.Any() ? PredicateBuilder.False<Activity>() : PredicateBuilder.True<Activity>();

            foreach (var keyword in keywordsList)
            {
                predicate = predicate.Or(p => p.Name.Contains(keyword));
                predicate = predicate.Or(p => p.Description != null && p.Description.Contains(keyword));
                predicate = predicate.Or(p => p.ActivityTags.Select(t => t.Tag).Any(t => t.Name.Contains(keyword)));
            }

            return predicate;
        }

        public bool ContainsString(string[] keywords)
        {
            var keywordsList = keywords.Where(k => !string.IsNullOrEmpty(k)).ToList();
            return keywordsList.Any(
                keyword =>
                Name.Contains(keyword)
                || (Description != null && Description.Contains(keyword))
                || ActivityTags.Select(t => t.Tag).Any(t => t.Name.Contains(keyword)));
        }

    }
}