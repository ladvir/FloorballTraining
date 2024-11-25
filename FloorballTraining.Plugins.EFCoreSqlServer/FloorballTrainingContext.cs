using System.Reflection;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class FloorballTrainingContext(DbContextOptions<FloorballTrainingContext> options) : IdentityDbContext<ApplicationUser, ApplicationRole, string>(options)
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