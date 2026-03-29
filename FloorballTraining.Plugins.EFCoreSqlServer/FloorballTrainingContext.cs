using System.Reflection;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class FloorballTrainingContext(DbContextOptions<FloorballTrainingContext> options) : IdentityDbContext<AppUser>(options)
    {
        public DbSet<Tag> Tags { get; set; } = null!;

        public DbSet<Activity> Activities { get; set; } = null!;

        public DbSet<ActivityAgeGroup> ActivityAgeGroups { get; set; } = null!;

        public DbSet<ActivityEquipment> ActivityEquipments { get; set; } = null!;

        public DbSet<ActivityMedia> ActivityMedium { get; set; } = null!;

        public DbSet<ActivityTag> ActivityTags { get; set; } = null!;

        public DbSet<Equipment> Equipments { get; set; } = null!;

        public DbSet<AgeGroup> AgeGroups { get; set; } = null!;

        public DbSet<Training> Trainings { get; set; } = null!;

        public DbSet<Place> Places { get; set; } = null!;

        public DbSet<TrainingAgeGroup> TrainingAgeGroups { get; set; } = null!;

        public DbSet<TrainingGroup> TrainingGroups { get; set; } = null!;

        public DbSet<TrainingPart> TrainingParts { get; set; } = null!;

        public DbSet<Team> Teams { get; set; } = null!;

        public DbSet<Club> Clubs { get; set; } = null!;

        public DbSet<Member> Members { get; set; } = null!;
        public DbSet<TeamMember> TeamMembers { get; set; } = null!;


        public DbSet<Appointment> Appointments { get; set; } = null!;

        public DbSet<RepeatingPattern> RepeatingPatterns { get; set; } = null!;
public DbSet<Season> Seasons { get; set; } = null!;

        public DbSet<RoleRequest> RoleRequests { get; set; } = null!;

        public DbSet<Notification> Notifications { get; set; } = null!;

        public DbSet<AppointmentRating> AppointmentRatings { get; set; } = null!;

        public DbSet<TestDefinition> TestDefinitions { get; set; } = null!;

        public DbSet<GradeOption> GradeOptions { get; set; } = null!;

        public DbSet<TestColourRange> TestColourRanges { get; set; } = null!;

        public DbSet<TestResult> TestResults { get; set; } = null!;

        private List<Equipment> _equipments = new();

        private List<AgeGroup> _ageGroups = new();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            InitiateAgeGroups();
            InitiateEquipments();

            SeedTag(modelBuilder);
            SeedEquipment(modelBuilder);
            SeedAgeGroup(modelBuilder);
            SeedActivity(modelBuilder);
            SeedActivityAgeGroup(modelBuilder);
            SeedActivityTag(modelBuilder);
            SeedPlace(modelBuilder);
            SeedFlorbal2021Tests(modelBuilder);
        }

        private void InitiateEquipments()
        {
            _equipments = new()  {
            new() { Id = 1, Name = "Rozlišovací dresy" },
            new() { Id = 2, Name = "Kužely" },
            new() { Id = 3, Name = "Skočky" },
            new() { Id = 4, Name = "Žebřík" },
            new() { Id = 5, Name = "Švihadlo" },
            new() { Id = 6, Name = "Fotbalový míč" },
            new() { Id = 7, Name = "Florbalové míčky" },
            new() { Id = 8, Name = "Florbalová branka" },
            new() { Id = 9, Name = "Florbalky" }
        };
        }

        private void InitiateAgeGroups()
        {
            _ageGroups = new() {
               new (){ Description = AgeGroup.AnyAge, Name = AgeGroup.AnyAge, Id = 1 },
               new() { Description = "U7 - předpřípravka", Name = "U7", Id = 7 },
               new() { Description = "U9 - přípravka", Name = "U9", Id = 9 },
               new() { Description = "U11 - elévi", Name = "U11", Id = 11 },
               new() { Description = "U13 - ml. žáci", Name = "U13", Id = 13 },
               new() { Description = "U15 - st. žáci", Name = "U15", Id = 15 },
               new() { Description = "U17 - dorost", Name = "U17", Id = 17 },
               new() { Description = "U21 - junioři", Name = "U21", Id = 21 },
               new() { Description = "Dospělí", Name = "Dospělí", Id = 23 }
            };
        }

        
        private void SeedActivityTag(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ActivityTag>().HasData(
                new List<ActivityTag>
                {
                    new() {Id = 1, ActivityId = 1, TagId = 31 },
                    new() {Id = 2,  ActivityId = 1, TagId = 35 },
                    new() {Id = 3,  ActivityId = 3, TagId = 31 },
                    new() {Id = 4,  ActivityId = 3, TagId = 35 },
                    new() {Id = 5,  ActivityId = 20, TagId = 35 },
                    new() {Id = 6,  ActivityId = 20, TagId = 41 }
                }
            );
        }

        private void SeedActivityAgeGroup(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ActivityAgeGroup>().HasData(
                new List<ActivityAgeGroup>
                {
                    new() {Id = 1, ActivityId = 1, AgeGroupId = 11 },
                    new() {Id = 2,  ActivityId = 1, AgeGroupId = 7 },
                    new() { Id = 3, ActivityId = 3, AgeGroupId = 11 },
                    new() { Id = 4,  ActivityId = 3, AgeGroupId = 7 },
                    new() { Id = 5,  ActivityId = 20, AgeGroupId = 11 }
                }
                );
        }

        private void SeedPlace(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Place>().HasData(
                new Place { Environment = Environment.Indoor, Name = "GMK", Width = 17, Length = 40, Id = 1 },
                new Place { Environment = Environment.Indoor, Name = "Komenda", Width = 25, Length = 60, Id = 2 },
                new Place { Environment = Environment.Indoor, Name = "TGM", Width = 10, Length = 20, Id = 3 },
                new Place { Environment = Environment.Outdoor, Name = "Venkovní hřiště za Komendou", Width = 20, Length = 40, Id = 4 },
                new Place { Environment = Environment.Indoor, Name = "Domov", Width = 3, Length = 3, Id = 5 }
                );
        }

        private void SeedAgeGroup(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AgeGroup>().HasData(_ageGroups);
        }

        private void SeedEquipment(ModelBuilder modelBuilder) => modelBuilder.Entity<Equipment>().HasData(_equipments);

        private static void SeedTag(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Tag>().HasData(
                new Tag { Id = 1, Name = "Zaměření tréninku", ParentTagId = null, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 11, Name = "1 x 1", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 12, Name = "2 x 2", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 13, Name = "3 x 3", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 14, Name = "4 x 4", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 15, Name = "5 x 5", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 16, Name = "2 x 3", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 17, Name = "2 x 1", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 29, Name = "Střelba", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 30, Name = "Přihrávka", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 31, Name = "Vedení míčku", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 35, Name = "Uvolňování", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 37, Name = "Herní myšlení", ParentTagId = 1, Color = "#e6e9eb", IsTrainingGoal = true },
                new Tag { Id = 38, Name = "Spolupráce v týmu", ParentTagId = 1, Color = "#e6e9eb", IsTrainingGoal = true },
                new Tag { Id = 18, Name = "Brankář", ParentTagId = 1, Color = "#27dbf5", IsTrainingGoal = true },
                new Tag { Id = 19, Name = "Útočník", ParentTagId = 1, Color = "#27dbf5", IsTrainingGoal = true },
                new Tag { Id = 20, Name = "Obránce", ParentTagId = 1, Color = "#27dbf5", IsTrainingGoal = true },
                new Tag { Id = 6, Name = "Tělesná průprava", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
                new Tag { Id = 32, Name = "Ohebnost", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
                new Tag { Id = 33, Name = "Síla", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
                new Tag { Id = 34, Name = "Výbušnost", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
                new Tag { Id = 36, Name = "Rychlost", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
                new Tag { Id = 40, Name = "Hokejový dribling", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
                new Tag { Id = 41, Name = "Florbalový dribling", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },

                new Tag { Id = 5, Name = "Forma", ParentTagId = null, Color = "#d9980d" },
                new Tag { Id = 25, Name = "Hra", ParentTagId = 5, Color = "#d9980d" },
                new Tag { Id = 27, Name = "Test", ParentTagId = 5, Color = "#d9980d" },
                new Tag { Id = 28, Name = "Štafeta", ParentTagId = 5, Color = "#d9980d" },
                new Tag { Id = 39, Name = "Výzva", ParentTagId = 5, Color = "#d9980d" },

                new Tag { Id = 4, Name = "Tréninková část", ParentTagId = null, Color = "#0989c2" },
                new Tag { Id = 21, Name = "Rozehřátí", ParentTagId = 4, Color = "#0989c2" },
                new Tag { Id = 22, Name = "Rozcvička", ParentTagId = 4, Color = "#0989c2" },
                new Tag { Id = 23, Name = "Hlavní část", ParentTagId = 4, Color = "#0989c2" },
                new Tag { Id = 24, Name = "Protahování", ParentTagId = 4, Color = "#0989c2" },
                new Tag { Id = 10, Name = "Vlastní", ParentTagId = null, Color = "#666666" }
                );
        }

        private void SeedFlorbal2021Tests(ModelBuilder modelBuilder)
        {
            // Základní údaje
            modelBuilder.Entity<TestDefinition>().HasData(
                new TestDefinition { Id = 1000, Name = "Tělesná výška", Category = TestCategory.BasicInfo, TestType = TestType.Number, Unit = "cm", HigherIsBetter = true, IsTemplate = true, SortOrder = 1 },
                new TestDefinition { Id = 1001, Name = "Tělesná hmotnost", Category = TestCategory.BasicInfo, TestType = TestType.Number, Unit = "kg", HigherIsBetter = false, IsTemplate = true, SortOrder = 2 },
                new TestDefinition { Id = 1002, Name = "Tělesný tuk", Category = TestCategory.BasicInfo, TestType = TestType.Number, Unit = "%", HigherIsBetter = false, IsTemplate = true, SortOrder = 3 },
                new TestDefinition { Id = 1003, Name = "Držení hole", Category = TestCategory.BasicInfo, TestType = TestType.Grade, IsTemplate = true, SortOrder = 4 },

                // Flexibilita
                new TestDefinition { Id = 1010, Name = "Hluboký předklon", Category = TestCategory.Flexibility, TestType = TestType.Grade, IsTemplate = true, SortOrder = 10 },
                new TestDefinition { Id = 1011, Name = "V-test (vnitřní strana stehen)", Category = TestCategory.Flexibility, TestType = TestType.Grade, IsTemplate = true, SortOrder = 11 },
                new TestDefinition { Id = 1012, Name = "Protažení přední strany stehna", Category = TestCategory.Flexibility, TestType = TestType.Grade, IsTemplate = true, SortOrder = 12 },

                // Kondiční testy
                new TestDefinition { Id = 1020, Name = "Sprint 20 m", Category = TestCategory.Conditioning, TestType = TestType.Number, Unit = "s", HigherIsBetter = false, IsTemplate = true, SortOrder = 20 },
                new TestDefinition { Id = 1021, Name = "Skok z místa snožmo", Category = TestCategory.Conditioning, TestType = TestType.Number, Unit = "cm", HigherIsBetter = true, IsTemplate = true, SortOrder = 21 },
                new TestDefinition { Id = 1022, Name = "Illinois agility bez hole", Category = TestCategory.Conditioning, TestType = TestType.Number, Unit = "s", HigherIsBetter = false, IsTemplate = true, SortOrder = 22 },
                new TestDefinition { Id = 1023, Name = "Vznos na hrazdě", Category = TestCategory.Conditioning, TestType = TestType.Number, Unit = "počet", HigherIsBetter = true, IsTemplate = true, SortOrder = 23 },
                new TestDefinition { Id = 1024, Name = "Hluboký zadní dřep 1RM", Category = TestCategory.Conditioning, TestType = TestType.Number, Unit = "kg", HigherIsBetter = true, IsTemplate = true, SortOrder = 24 },
                new TestDefinition { Id = 1025, Name = "Bench press 1RM", Category = TestCategory.Conditioning, TestType = TestType.Number, Unit = "kg", HigherIsBetter = true, IsTemplate = true, SortOrder = 25 },
                new TestDefinition { Id = 1026, Name = "Yo-Yo IRT Level 1", Category = TestCategory.Conditioning, TestType = TestType.Number, Unit = "m", HigherIsBetter = true, IsTemplate = true, SortOrder = 26 },

                // Technické testy
                new TestDefinition { Id = 1030, Name = "Manipulace s míčkem (osmičky za 45 s)", Category = TestCategory.Technique, TestType = TestType.Number, Unit = "počet", HigherIsBetter = true, IsTemplate = true, SortOrder = 30 },
                new TestDefinition { Id = 1031, Name = "Přihrávka z pohybu", Category = TestCategory.Technique, TestType = TestType.Number, Unit = "počet", HigherIsBetter = true, IsTemplate = true, SortOrder = 31 },
                new TestDefinition { Id = 1032, Name = "Střelba z pohybu", Category = TestCategory.Technique, TestType = TestType.Number, Unit = "počet", HigherIsBetter = true, IsTemplate = true, SortOrder = 32 },
                new TestDefinition { Id = 1033, Name = "Illinois agility s holí a míčkem", Category = TestCategory.Technique, TestType = TestType.Number, Unit = "s", HigherIsBetter = false, IsTemplate = true, SortOrder = 33 },

                // Brankářské testy
                new TestDefinition { Id = 1040, Name = "Brankářský test - reakce", Category = TestCategory.Goalkeeper, TestType = TestType.Number, Unit = "s", HigherIsBetter = false, IsTemplate = true, SortOrder = 40 },
                new TestDefinition { Id = 1041, Name = "Brankářský test - pohyb v brance", Category = TestCategory.Goalkeeper, TestType = TestType.Number, Unit = "s", HigherIsBetter = false, IsTemplate = true, SortOrder = 41 },
                new TestDefinition { Id = 1042, Name = "Brankářský test - výhozy", Category = TestCategory.Goalkeeper, TestType = TestType.Number, Unit = "počet", HigherIsBetter = true, IsTemplate = true, SortOrder = 42 },
                new TestDefinition { Id = 1043, Name = "Brankářský test - rozklek", Category = TestCategory.Goalkeeper, TestType = TestType.Number, Unit = "s", HigherIsBetter = false, IsTemplate = true, SortOrder = 43 }
            );

            // Grade options - Držení hole
            modelBuilder.Entity<GradeOption>().HasData(
                new GradeOption { Id = 1000, TestDefinitionId = 1003, Label = "Levá", NumericValue = 1, SortOrder = 1 },
                new GradeOption { Id = 1001, TestDefinitionId = 1003, Label = "Pravá", NumericValue = 2, SortOrder = 2 }
            );

            // Grade options - Flexibilita testy (zkrácené / OK / hypermobilní)
            modelBuilder.Entity<GradeOption>().HasData(
                // Hluboký předklon
                new GradeOption { Id = 1010, TestDefinitionId = 1010, Label = "Zkrácené", NumericValue = 1, Colour = "#ef4444", SortOrder = 1 },
                new GradeOption { Id = 1011, TestDefinitionId = 1010, Label = "OK", NumericValue = 2, Colour = "#22c55e", SortOrder = 2 },
                new GradeOption { Id = 1012, TestDefinitionId = 1010, Label = "Hypermobilní", NumericValue = 3, Colour = "#eab308", SortOrder = 3 },
                // V-test
                new GradeOption { Id = 1013, TestDefinitionId = 1011, Label = "Zkrácené", NumericValue = 1, Colour = "#ef4444", SortOrder = 1 },
                new GradeOption { Id = 1014, TestDefinitionId = 1011, Label = "OK", NumericValue = 2, Colour = "#22c55e", SortOrder = 2 },
                new GradeOption { Id = 1015, TestDefinitionId = 1011, Label = "Hypermobilní", NumericValue = 3, Colour = "#eab308", SortOrder = 3 },
                // Protažení přední strany stehna
                new GradeOption { Id = 1016, TestDefinitionId = 1012, Label = "Zkrácené", NumericValue = 1, Colour = "#ef4444", SortOrder = 1 },
                new GradeOption { Id = 1017, TestDefinitionId = 1012, Label = "OK", NumericValue = 2, Colour = "#22c55e", SortOrder = 2 },
                new GradeOption { Id = 1018, TestDefinitionId = 1012, Label = "Hypermobilní", NumericValue = 3, Colour = "#eab308", SortOrder = 3 }
            );

            // Colour ranges pro kondiční testy - příklad pro Sprint 20m (U13-Dospělí, obě pohlaví)
            modelBuilder.Entity<TestColourRange>().HasData(
                // Sprint 20m - U13 Male
                new TestColourRange { Id = 1000, TestDefinitionId = 1020, AgeGroupId = 13, Gender = Gender.Male, GreenFrom = 0, GreenTo = 3.5, YellowFrom = 3.5, YellowTo = 4.0 },
                // Sprint 20m - U13 Female
                new TestColourRange { Id = 1001, TestDefinitionId = 1020, AgeGroupId = 13, Gender = Gender.Female, GreenFrom = 0, GreenTo = 3.7, YellowFrom = 3.7, YellowTo = 4.2 },
                // Sprint 20m - U15 Male
                new TestColourRange { Id = 1002, TestDefinitionId = 1020, AgeGroupId = 15, Gender = Gender.Male, GreenFrom = 0, GreenTo = 3.3, YellowFrom = 3.3, YellowTo = 3.8 },
                // Sprint 20m - U15 Female
                new TestColourRange { Id = 1003, TestDefinitionId = 1020, AgeGroupId = 15, Gender = Gender.Female, GreenFrom = 0, GreenTo = 3.5, YellowFrom = 3.5, YellowTo = 4.0 },
                // Sprint 20m - U17 Male
                new TestColourRange { Id = 1004, TestDefinitionId = 1020, AgeGroupId = 17, Gender = Gender.Male, GreenFrom = 0, GreenTo = 3.1, YellowFrom = 3.1, YellowTo = 3.5 },
                // Sprint 20m - U17 Female
                new TestColourRange { Id = 1005, TestDefinitionId = 1020, AgeGroupId = 17, Gender = Gender.Female, GreenFrom = 0, GreenTo = 3.4, YellowFrom = 3.4, YellowTo = 3.8 },

                // Skok z místa - U13 Male
                new TestColourRange { Id = 1010, TestDefinitionId = 1021, AgeGroupId = 13, Gender = Gender.Male, GreenFrom = 180, GreenTo = 300, YellowFrom = 150, YellowTo = 180 },
                // Skok z místa - U13 Female
                new TestColourRange { Id = 1011, TestDefinitionId = 1021, AgeGroupId = 13, Gender = Gender.Female, GreenFrom = 160, GreenTo = 280, YellowFrom = 130, YellowTo = 160 },
                // Skok z místa - U15 Male
                new TestColourRange { Id = 1012, TestDefinitionId = 1021, AgeGroupId = 15, Gender = Gender.Male, GreenFrom = 200, GreenTo = 320, YellowFrom = 170, YellowTo = 200 },
                // Skok z místa - U15 Female
                new TestColourRange { Id = 1013, TestDefinitionId = 1021, AgeGroupId = 15, Gender = Gender.Female, GreenFrom = 175, GreenTo = 300, YellowFrom = 145, YellowTo = 175 },

                // Yo-Yo IRT L1 - U15 Male
                new TestColourRange { Id = 1020, TestDefinitionId = 1026, AgeGroupId = 15, Gender = Gender.Male, GreenFrom = 1200, GreenTo = 3000, YellowFrom = 800, YellowTo = 1200 },
                // Yo-Yo IRT L1 - U15 Female
                new TestColourRange { Id = 1021, TestDefinitionId = 1026, AgeGroupId = 15, Gender = Gender.Female, GreenFrom = 800, GreenTo = 2500, YellowFrom = 500, YellowTo = 800 },
                // Yo-Yo IRT L1 - U17 Male
                new TestColourRange { Id = 1022, TestDefinitionId = 1026, AgeGroupId = 17, Gender = Gender.Male, GreenFrom = 1600, GreenTo = 3500, YellowFrom = 1100, YellowTo = 1600 },
                // Yo-Yo IRT L1 - U17 Female
                new TestColourRange { Id = 1023, TestDefinitionId = 1026, AgeGroupId = 17, Gender = Gender.Female, GreenFrom = 1000, GreenTo = 3000, YellowFrom = 600, YellowTo = 1000 }
            );
        }

        private static void SeedActivity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Activity>().HasData(
                new Activity
                {
                    Id = 1,
                    Name = "Dračí zápasy",
                    Description =
                        @"Děti se rozdělí do dvou družstev, děti se drží za pas, první v řadě je hlava draka, poslední je ocas draka, družstva stojí asi 10 metrů od sebe, na povel se snaží hlava draka chytit ocas draka protihráče",
                    DurationMin = 5,
                    DurationMax = 10,
                    PersonsMin = 4,
                    Difficulty = Difficulties.Low,
                    Intensity = Intensities.Low
                },
                new Activity
                {
                    Id = 2,
                    Name = "Čertovská honička",
                    Description =
                        @"Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.",
                    DurationMin = 5,
                    DurationMax = 15,
                    PersonsMin = 5,
                    Difficulty = Difficulties.Low,
                    Intensity = Intensities.Medium
                },
                new Activity
                {
                    Id = 3,
                    Name = "Florbal 3x3",
                    DurationMin = 10,
                    DurationMax = 20,
                    PersonsMin = 6,
                    PersonsMax = 12,
                    Difficulty = Difficulties.High,
                    Intensity = Intensities.High
                },
                new Activity
                {
                    Id = 4,
                    Name = "Na ovečky a vlky s florbalkou a míčkem",
                    Description =
                        @"Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka, která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.",
                    DurationMin = 5,
                    DurationMax = 15,
                    PersonsMin = 15,
                    Difficulty = Difficulties.Low,
                    Intensity = Intensities.Medium
                },
                new Activity
                {
                    Id = 5,
                    Name = "Florbal 1x1",
                    DurationMin = 5,
                    DurationMax = 10,
                    PersonsMin = 2,
                    PersonsMax = 10,
                    Difficulty = Difficulties.High,
                    Intensity = Intensities.High
                },
                new Activity
                {
                    Id = 6,
                    Name = "Florbal 2x2",
                    DurationMin = 10,
                    DurationMax = 20,
                    PersonsMin = 4,
                    PersonsMax = 10,
                    Difficulty = Difficulties.High,
                    Intensity = Intensities.High
                },
                new Activity
                {
                    Id = 7,
                    Name = "Florbal 5x5",
                    DurationMin = 10,
                    DurationMax = 20,
                    PersonsMin = 10,
                    PersonsMax = 30,
                    Difficulty = Difficulties.High,
                    Intensity = Intensities.High
                },
                new Activity
                {
                    Id = 20,
                    Name = "Florbalový dribling v kruhu",
                    Description = "Hráč si udělá z kloboučků kruh. Mezera mezi kloboučky alespoň 30 cm. Hráč stojí s míčkem uprostřed a postupně provádí florbalový dribling stále dokola.",
                    Environment = Environment.Anywhere,
                    PlaceWidth = 2,
                    PlaceLength = 2,
                    DurationMin = 3,
                    DurationMax = 10,
                    PersonsMin = 1,
                    PersonsMax = 30,
                    Difficulty = Difficulties.Low,
                    Intensity = Intensities.Low
                }
            );
        }


        
    }
}