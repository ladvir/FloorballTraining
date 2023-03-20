using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;
using TrainingDataAccess.Services.ActivityServices;

namespace TrainingDataAccess.Models
{
    [Table("Trainings")]
    public class Training
    {
        [Key]
        [Required]
        public int TrainingId { get; private set; }

        public string Name { get; private set; } = string.Empty;

        public string? Description { get; private set; } = string.Empty;

        public int Duration { get; private set; }

        public int Persons { get; private set; }


        public List<TrainingPart> TrainingParts { get; set; } = new List<TrainingPart>();

        public Training()
        {
        }

        public static Training Create(int trainingId, string name, string? description, int duration, int persons)
        {
            var training = new Training();
            training.Initialize(trainingId, name, description, duration, persons);
            return training;

        }
        public static Training Create(Training training)
        {
            return new Training
            {
                TrainingId = training.TrainingId,
                Name = training.Name,
                Description = training.Description,
                Duration = training.Duration,
                Persons = training.Persons,
                TrainingParts = training.TrainingParts
            };
        }

        public virtual void Initialize(int trainingId, string name, string? description, int duration, int persons)
        {
            TrainingId = trainingId;
            Name = name;
            Description = description;
            Duration = duration;
            Persons = persons;
        }

        public void AddTrainingParts(List<TrainingPart> trainignParts)
        {
            TrainingParts.AddRange(trainignParts);
        }

        public void AddTrainingPart(TrainingPart trainignPart)
        {
            TrainingParts.Add(trainignPart);
        }

        //public void SetValuesBasedOnActivities()
        //{
        //    this.Duration = TrainingParts.Sum(tp => tp.Activities.Sum(a => a.DurationMax.GetValueOrDefault(0)));
        //    this.Persons = TrainingParts.Sum(tp => tp.Activities.Min(a => a.PersonsMax.GetValueOrDefault(999)));
        //}


        public static Expression<Func<Training, bool>> Contains(
            params string[] keywords)
        {
            var keywordsList = keywords.Where(k => !string.IsNullOrEmpty(k)).ToList();

            var predicate = keywordsList.Any() ? PredicateBuilder.False<Training>() : PredicateBuilder.True<Training>();

            foreach (var keyword in keywordsList)
            {
                predicate = predicate.Or(p => p.Name.Contains(keyword));
                predicate = predicate.Or(p => p.Description != null && p.Description.Contains(keyword));
                //predicate = predicate.Or(p => p.TrainingParts.Any(t => t.Contains(keyword)));
            }

            return predicate;
        }
    }



}
