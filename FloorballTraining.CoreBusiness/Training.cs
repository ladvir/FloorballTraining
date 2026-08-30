using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness
{
    public class Training : BaseEntity, IAuditable
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

        public Environment Environment { get; set; } = Environment.Anywhere;

        // Doplňující, nevalidované štítky (#163) — libovolný počet, na rozdíl od cílových
        // dovedností níže nejsou nijak omezené ani povinné.
        public List<TrainingTag> TrainingTags { get; set; } = new();

        // Explicitní "tenhle trénink záměrně nerozvíjí žádnou konkrétní dovednost" (volná hra,
        // zápas, team building...) — obchází požadavek na aspoň jednu cílovou dovednost níže.
        public bool NoSpecificGoal { get; set; }

        // Cílové dovednosti (#163) — primární, validovaný koncept "co tento trénink rozvíjí".
        public Skill? TrainingGoalSkill1 { get; set; }

        public int? TrainingGoalSkill1Id { get; set; }

        public Skill? TrainingGoalSkill2 { get; set; }

        public int? TrainingGoalSkill2Id { get; set; }

        public Skill? TrainingGoalSkill3 { get; set; }

        public int? TrainingGoalSkill3Id { get; set; }

        public List<TrainingAgeGroup> TrainingAgeGroups { get; set; } = new();
        public List<TrainingPart>? TrainingParts { get; set; }

        public List<Appointment>? Appointments { get; set; }

        public bool IsDraft { get; set; } = true;

        public bool IsIndividual { get; set; }

        public string? CreatedByUserId { get; set; }
        public string? UpdatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public string? ActivitySignature { get; set; }

        public Training Clone()
        {
            return new Training
            {
                Environment = Environment,
                Name = Name,
                Description = Description,
                Duration = Duration,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                GoaliesMin = GoaliesMin,
                GoaliesMax = GoaliesMax,
                TrainingTags = TrainingTags,
                NoSpecificGoal = NoSpecificGoal,
                TrainingGoalSkill1 = TrainingGoalSkill1,
                TrainingGoalSkill1Id = TrainingGoalSkill1Id,
                TrainingGoalSkill2 = TrainingGoalSkill2,
                TrainingGoalSkill2Id = TrainingGoalSkill2Id,
                TrainingGoalSkill3 = TrainingGoalSkill3,
                TrainingGoalSkill3Id = TrainingGoalSkill3Id,
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
            Environment = other.Environment;
            Description = other.Description;
            Duration = other.Duration;
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            GoaliesMin = other.GoaliesMin;
            GoaliesMax = other.GoaliesMax;
            TrainingTags = other.TrainingTags;
            NoSpecificGoal = other.NoSpecificGoal;
            TrainingGoalSkill1 = other.TrainingGoalSkill1;
            TrainingGoalSkill1Id = other.TrainingGoalSkill1Id;
            TrainingGoalSkill2 = other.TrainingGoalSkill2;
            TrainingGoalSkill2Id = other.TrainingGoalSkill2Id;
            TrainingGoalSkill3 = other.TrainingGoalSkill3;
            TrainingGoalSkill3Id = other.TrainingGoalSkill3Id;
            Difficulty = other.Difficulty;
            Intensity = other.Intensity;
            TrainingParts = other.TrainingParts;
            CommentBefore = other.CommentBefore;
            CommentAfter = other.CommentAfter;
            TrainingAgeGroups = other.TrainingAgeGroups;
            Appointments = other.Appointments;
            IsDraft = other.IsDraft;
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

        public void AddTag(Tag tag)
        {
            if (TrainingTags.All(tt => tt.Tag != tag))
            {
                TrainingTags.Add(new TrainingTag
                {
                    Training = this,
                    TrainingId = Id,
                    Tag = tag,
                    TagId = tag.Id
                });
            }
        }

        /// <summary>Minutes of training parts whose activities carry one of the 3 goal skills
        /// (#163) — the validated "does this training's content match its stated focus" check.</summary>
        public int GetGoalSkillActivitiesDuration()
        {
            if (TrainingParts == null || TrainingParts.Sum(tp => tp.TrainingGroups!.Count) == 0) return 0;

            if (TrainingGoalSkill1 == null && TrainingGoalSkill2 == null && TrainingGoalSkill3 == null) return 0;

            return TrainingParts.Where(tp =>
                    tp.TrainingGroups!.Any(tga =>
                        tga.Activity != null && tga.Activity.ActivitySkills.Any(s =>
                            s.SkillId == TrainingGoalSkill1?.Id || s.SkillId == TrainingGoalSkill2?.Id || s.SkillId == TrainingGoalSkill3?.Id)))
                .Sum(tp => tp.Duration);
        }

        /// <summary>
        /// Same shape as <see cref="GetGoalSkillActivitiesDuration"/> but measured against an
        /// external skill set (season-plan cycle goals): minutes of training parts whose activities
        /// carry any of the given skills. Requires TrainingParts→TrainingGroups→Activity→ActivitySkills loaded.
        /// </summary>
        public int GetActivitiesDurationForSkills(IReadOnlyCollection<int> skillIds)
        {
            if (skillIds.Count == 0 || TrainingParts == null) return 0;

            return TrainingParts
                .Where(tp => tp.TrainingGroups != null && tp.TrainingGroups.Any(tg =>
                    tg.Activity != null && tg.Activity.ActivitySkills.Any(s =>
                        s.SkillId.HasValue && skillIds.Contains(s.SkillId.Value))))
                .Sum(tp => tp.Duration);
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

        /// <summary>Skills this training develops, aggregated from its activities' ActivitySkills (#171).</summary>
        public List<string?> GetSkillNames()
        {
            if (TrainingParts == null) return new List<string?>();

            return TrainingParts.SelectMany(tp => tp.TrainingGroups!)
                .Where(tga => tga.Activity != null)
                .SelectMany(tga => tga.Activity!.ActivitySkills)
                .Select(ase => ase.Skill?.Name)
                .Distinct().ToList();
        }

        public string GetTrainingGoalsNames()
        {
            return string.Join(", ", TrainingTags.Where(tt => tt.Tag != null).Select(tt => tt.Tag!.Name));
        }
    }
}
