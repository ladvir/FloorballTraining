﻿namespace FloorballTraining.CoreBusiness
{
    public class Training : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int Duration { get; set; } = 1;

        public int PersonsMin { get; set; } = 1;
        public int PersonsMax { get; set; }
        public int GoaliesMin { get; set; }
        public int GoaliesMax { get; set; }

        public int Intensity { get; set; }

        public int Difficulty { get; set; }


        public string? CommentBefore { get; set; } = string.Empty;
        public string? CommentAfter { get; set; } = string.Empty;


        public Place? Place { get; set; }

        public int PlaceId { get; set; }


        public Tag? TrainingGoal1 { get; set; }

        public int? TrainingGoal1Id { get; set; }

        public Tag? TrainingGoal2 { get; set; }

        public int? TrainingGoal2Id { get; set; }

        public Tag? TrainingGoal3 { get; set; }

        public int? TrainingGoal3Id { get; set; }

        public List<TrainingAgeGroup> TrainingAgeGroups { get; set; } = new();
        public List<TrainingPart>? TrainingParts { get; set; }

        public List<Appointment>? Appointments { get; set; }

        public Training Clone()
        {
            return new Training
            {
                //Id = Id,
                Place = Place,
                Name = Name,
                Description = Description,
                Duration = Duration,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                GoaliesMin = GoaliesMin,
                GoaliesMax = GoaliesMax,
                TrainingGoal1 = TrainingGoal1,
                TrainingGoal1Id = TrainingGoal1Id,
                TrainingGoal2 = TrainingGoal2,
                TrainingGoal2Id = TrainingGoal2Id,
                TrainingGoal3 = TrainingGoal3,
                TrainingGoal3Id = TrainingGoal3Id,
                Difficulty = Difficulty,
                Intensity = Intensity,
                CommentBefore = CommentBefore,
                CommentAfter = CommentAfter,
                TrainingParts = Clone(TrainingParts),
                TrainingAgeGroups = Clone(TrainingAgeGroups),
                Appointments = Clone(Appointments)
            };
        }

        private static List<TrainingAgeGroup> Clone(List<TrainingAgeGroup> trainingAgeGroups)
        {
            return trainingAgeGroups.Select(trainingAgeGroup => trainingAgeGroup.Clone()).ToList();
        }

        private static List<TrainingPart> Clone(List<TrainingPart>? trainingParts)
        {
            return (trainingParts ?? new List<TrainingPart>()).Select(trainingPart => trainingPart.Clone()).ToList();
        }


        private static List<Appointment> Clone(List<Appointment>? appointments)
        {
            return (appointments ?? new List<Appointment>()).Select(appointment => appointment.Clone()).ToList();
        }
        public void Merge(Training other)
        {
            Name = other.Name;
            Place = other.Place;
            Description = other.Description;
            Duration = other.Duration;
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            GoaliesMin = other.GoaliesMin;
            GoaliesMax = other.GoaliesMax;
            TrainingGoal1 = other.TrainingGoal1;
            TrainingGoal1Id = other.TrainingGoal1Id;
            TrainingGoal2 = other.TrainingGoal2;
            TrainingGoal2Id = other.TrainingGoal2Id;
            TrainingGoal3 = other.TrainingGoal3;
            TrainingGoal3Id = other.TrainingGoal3Id;
            Difficulty = other.Difficulty;
            Intensity = other.Intensity;
            TrainingParts = other.TrainingParts;
            CommentBefore = other.CommentBefore;
            CommentAfter = other.CommentAfter;
            TrainingAgeGroups = other.TrainingAgeGroups;
            Appointments = other.Appointments;
        }

        public void AddTrainingPart(TrainingPart trainingPart)
        {
            TrainingParts ??= new List<TrainingPart>();

            TrainingParts.Add(trainingPart);
        }

        public void AddTrainingPart()
        {
            AddTrainingPart(
            new TrainingPart
            {
                //Name = $"{TrainingParts?.Count + 1}",
                Order = TrainingParts != null && TrainingParts.Any() ? TrainingParts.Max(tp => tp.Order) : 0 + 1,
                TrainingGroups = new List<TrainingGroup>
                {
                    new()
                    {
                        PersonsMax = PersonsMax
                    }
                }
            });
        }

        public List<string?> GetEquipment()
        {
            if (TrainingParts == null) return new List<string?>();

            var x = TrainingParts.SelectMany(tp => tp.TrainingGroups!)
                .Select(a => a.Activity);

            var z = x.Where(a => a != null && a.ActivityEquipments.Any()).AsEnumerable().SelectMany(a => a!.ActivityEquipments);

            var zz = z.Select(ae => ae.Equipment?.Name).Distinct().ToList();

            return zz;

        }

        public int GetActivitiesDuration()
        {
            return TrainingParts?.Sum(t => t.Duration) ?? 0;
        }

        public int GetTrainingGoalActivitiesDuration()
        {
            if (TrainingParts == null || TrainingParts != null && TrainingParts.Sum(tp => tp.TrainingGroups!.Count) == 0) return 0;

            if (TrainingGoal1 == null && TrainingGoal2 == null && TrainingGoal3 == null) return 0;

            var trainingPartsWithTrainingGoal = TrainingParts!.Where(tp =>
                    tp.TrainingGroups!.Any(tga =>
                        tga.Activity != null && tga.Activity.ActivityTags.Any(tag => tag.TagId == TrainingGoal1?.Id || tag.TagId == TrainingGoal2?.Id || tag.TagId == TrainingGoal3?.Id)))
                .Sum(tp => tp.Duration);

            return trainingPartsWithTrainingGoal;
        }

        public void AddAgeGroup(AgeGroup ageGroup)
        {
            if (TrainingAgeGroups.All(at => at.AgeGroup != ageGroup))
            {
                TrainingAgeGroups.Add(new TrainingAgeGroup
                {
                    Training = this,
                    TrainingId = Id,
                    AgeGroup = ageGroup,
                    AgeGroupId = ageGroup.Id
                });
            }
        }

        public List<string?> GetAgeGroupNames()
        {
            var names = TrainingAgeGroups.Select(ae => ae.AgeGroup?.Description).OrderBy(d => d).ToList();

            if (!names.Any())
            {
                names.Add(AgeGroup.AnyAge);
            }

            return names;
        }

        public List<Activity> GetActivities()
        {
            if (TrainingParts == null) return new List<Activity>();

            return TrainingParts.SelectMany(tp => tp.TrainingGroups!)
                .Where(tga => tga.Activity != null)
                .Select(tga => tga.Activity!).ToList();
        }

        public List<string> GetActivityNames()
        {
            if (TrainingParts == null) return new List<string>();

            return TrainingParts.SelectMany(tp => tp.TrainingGroups!)
                .Where(tga => tga.Activity != null)
                .Select(tga => tga.Activity!.Name).ToList();
        }

        public string GetTrainingGoalsNames()
        {
            var goals = new List<string>();
            if (TrainingGoal1 != null) goals.Add(TrainingGoal1.Name);
            if (TrainingGoal2 != null) goals.Add(TrainingGoal2.Name);
            if (TrainingGoal3 != null) goals.Add(TrainingGoal3.Name);
            
            return string.Join(", ",goals);
        }
    }
}
