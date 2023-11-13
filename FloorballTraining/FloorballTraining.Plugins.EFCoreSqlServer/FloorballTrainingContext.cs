using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Environment = FloorballTraining.CoreBusiness.Environment;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class FloorballTrainingContext : DbContext
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
        public DbSet<TrainingGroupActivity> TrainingGroupActivities { get; set; } = null!;
        public DbSet<TrainingPart> TrainingParts { get; set; } = null!;

        public FloorballTrainingContext(DbContextOptions<FloorballTrainingContext> options) : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            //modelBuilder.Entity<Tag>().Property(p => p.TagId).UseIdentityColumn().ValueGeneratedNever();
            modelBuilder.Entity<Activity>().HasKey(t => t.ActivityId);
            modelBuilder.Entity<Equipment>().HasKey(t => t.EquipmentId);
            modelBuilder.Entity<AgeGroup>().HasKey(t => t.AgeGroupId);
            modelBuilder.Entity<Training>().HasKey(t => t.TrainingId);
            modelBuilder.Entity<Place>().HasKey(t => t.PlaceId);

            ActivityModelCreating(modelBuilder);

            
            //TrainingModelCreating(modelBuilder);

            modelBuilder.Entity<Place>()
                .HasMany(tg => tg.Trainings)
                .WithOne(tp => tp.Place)
                .HasForeignKey(tg => tg.PlaceId);




            SeedTag(modelBuilder);
            SeedEquipment(modelBuilder);
            SeedAgeGroup(modelBuilder);
            SeedActivity(modelBuilder);

            SeedActivityAgeGroup(modelBuilder);
            //SeedActivityTag(modelBuilder);

            SeedPlace(modelBuilder);

        }

        private void SeedActivityTag(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ActivityTag>().HasData( 
                new List<ActivityTag>
                {
                    new() {ActivityTagId = 1, ActivityId = 1, TagId = 31 },
                    new() {ActivityTagId = 2,  ActivityId = 1, TagId = 35 },
                    new() {ActivityTagId = 3,  ActivityId = 3, TagId = 31 },
                    new() {ActivityTagId = 4,  ActivityId = 3, TagId = 35 }
                }
            );
        }

        private void SeedActivityAgeGroup(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ActivityAgeGroup>().HasData(
                new List<ActivityAgeGroup>
                {
                    new() {ActivityAgeGroupId = 1, ActivityId = 1, AgeGroupId = 11 },
                    new() {ActivityAgeGroupId = 2,  ActivityId = 1, AgeGroupId = 7 },
                    new() { ActivityAgeGroupId = 3, ActivityId = 3, AgeGroupId = 11 },
                    new() { ActivityAgeGroupId = 4,  ActivityId = 3, AgeGroupId = 7 }
                }
                );
        }

        private void SeedPlace(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Place>().HasData(
                new Place { Environment = Environment.Indoor, Name = "GMK", Width = 17, Length = 40, PlaceId = 1 },
                new Place { Environment = Environment.Indoor, Name = "Komenda", Width = 25, Length = 60, PlaceId = 2 },
                new Place { Environment = Environment.Indoor, Name = "TGM", Width = 10, Length = 20, PlaceId = 3 },
                new Place { Environment = Environment.Outdoor, Name = "Venkovní hřiště za Komendou", Width = 20, Length = 40, PlaceId = 4 },
                new Place { Environment = Environment.Indoor, Name = "Domov", Width = 3, Length = 3, PlaceId = 5 }
                );
        }

        private static void SeedAgeGroup(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AgeGroup>().HasData(
                new AgeGroup { Description = "Kdokoliv", Name = "Kdokoliv", AgeGroupId = 1 },
                new AgeGroup { Description = "U7 - předpřípravka", Name = "U7", AgeGroupId = 7 },
                new AgeGroup { Description = "U9 - přípravka", Name = "U9", AgeGroupId = 9 },
                new AgeGroup { Description = "U11 - elévi", Name = "U11", AgeGroupId = 11 },
                new AgeGroup { Description = "U13 - ml. žáci", Name = "U13", AgeGroupId = 13 },
                new AgeGroup { Description = "U15 - st. žáci", Name = "U15", AgeGroupId = 15 },
                new AgeGroup { Description = "U17 - dorost", Name = "U17", AgeGroupId = 17 },
                new AgeGroup { Description = "U21 - junioři", Name = "U21", AgeGroupId = 21 },
                new AgeGroup { Description = "Dospělí", Name = "Dospeli", AgeGroupId = 23 }
            );
        }

        private static void SeedEquipment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Equipment>().HasData(
                new Equipment { EquipmentId = 1, Name = "Rozlišovací dresy" },
                new Equipment { EquipmentId = 2, Name = "Kužely" },
                new Equipment { EquipmentId = 3, Name = "Skočky" },
                new Equipment { EquipmentId = 4, Name = "Žebřík" },
                new Equipment { EquipmentId = 5, Name = "Švihadlo" },
                new Equipment { EquipmentId = 6, Name = "Fotbalový míč" },
                new Equipment { EquipmentId = 7, Name = "Florbalové míčky" },
                new Equipment { EquipmentId = 8, Name = "Florbalová branka" },
                new Equipment { EquipmentId = 9, Name = "Florbalky" }
                );
        }

        private static void SeedTag(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Tag>().HasData(
                new Tag { TagId = 1, Name = "Zaměření tréninku", ParentTagId = null, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 11, Name = "1 x 1", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 12, Name = "2 x 2", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 13, Name = "3 x 3", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 14, Name = "4 x 4", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 15, Name = "5 x 5", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 16, Name = "2 x 3", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 17, Name = "2 x 1", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 29, Name = "Střelba", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 30, Name = "Přihrávka", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 31, Name = "Vedení míčku", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 35, Name = "Uvolňování", ParentTagId = 1, Color = "#ffd254", IsTrainingGoal = true },
            new Tag { TagId = 37, Name = "Herní myšlení", ParentTagId = 1, Color = "#e6e9eb", IsTrainingGoal = true },
            new Tag { TagId = 38, Name = "Spolupráce v týmu", ParentTagId = 1, Color = "#e6e9eb", IsTrainingGoal = true },
            new Tag { TagId = 18, Name = "Brankář", ParentTagId = 1, Color = "#27dbf5", IsTrainingGoal = true },
            new Tag { TagId = 19, Name = "Útočník", ParentTagId = 1, Color = "#27dbf5", IsTrainingGoal = true },
            new Tag { TagId = 20, Name = "Obránce", ParentTagId = 1, Color = "#27dbf5", IsTrainingGoal = true },
            new Tag { TagId = 6, Name = "Tělesná průprava", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
            new Tag { TagId = 32, Name = "Ohebnost", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
            new Tag { TagId = 33, Name = "Síla", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
            new Tag { TagId = 34, Name = "Výbušnost", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },
            new Tag { TagId = 36, Name = "Rychlost", ParentTagId = 1, Color = "#17a258", IsTrainingGoal = true },

            new Tag { TagId = 5, Name = "Forma", ParentTagId = null, Color = "#d9980d" },
            new Tag { TagId = 25, Name = "Hra", ParentTagId = 5, Color = "#d9980d" },
            new Tag { TagId = 27, Name = "Test", ParentTagId = 5, Color = "#d9980d" },
            new Tag { TagId = 28, Name = "Štafeta", ParentTagId = 5, Color = "#d9980d" },
            new Tag { TagId = 39, Name = "Výzva", ParentTagId = 5, Color = "#d9980d" },

            new Tag { TagId = 4, Name = "Tréninková část", ParentTagId = null, Color = "#0989c2" },
            new Tag { TagId = 21, Name = "Rozehřátí", ParentTagId = 4, Color = "#0989c2" },
            new Tag { TagId = 22, Name = "Rozcvička", ParentTagId = 4, Color = "#0989c2" },
            new Tag { TagId = 23, Name = "Hlavní část", ParentTagId = 4, Color = "#0989c2" },
            new Tag { TagId = 24, Name = "Protahování", ParentTagId = 4, Color = "#0989c2" },
            new Tag { TagId = 10, Name = "Vlastní", ParentTagId = null, Color = "#666666" }
                );
        }

        private static void SeedActivity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Activity>().HasData(
                new Activity
                {
                    ActivityId = 1, Name = "Dračí zápasy",
                    Description =
                        @"Děti se rozdělí do dvou družstev, děti se drží za pas, první v řadě je hlava draka, poslední je ocas draka, družstva stojí asi 10 metrů od sebe, na povel se snaží hlava draka chytit ocas draka protihráče",
                    DurationMin = 5, DurationMax = 10, PersonsMin = 4, Difficulty = Difficulties.Low,
                    Intensity = Intensities.Low
                },
                new Activity
                {
                    ActivityId = 2, Name = "Čertovská honička",
                    Description =
                        @"Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.",
                    DurationMin = 5, DurationMax = 15, PersonsMin = 5, Difficulty = Difficulties.Low,
                    Intensity = Intensities.Medium
                },
                new Activity
                {
                    ActivityId = 3, Name = "Florbal 3x3", DurationMin = 10, DurationMax = 20, PersonsMin = 6,
                    PersonsMax = 12, Difficulty = Difficulties.High, Intensity = Intensities.High
                },
                new Activity
                {
                    ActivityId = 4, Name = "Na ovečky a vlky s florbalkou a míčkem",
                    Description =
                        @"Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka, která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.",
                    DurationMin = 5, DurationMax = 15, PersonsMin = 15, Difficulty = Difficulties.Low,
                    Intensity = Intensities.Medium
                },
                new Activity
                {
                    ActivityId = 5, Name = "Florbal 1x1", DurationMin = 5, DurationMax = 10, PersonsMin = 2,
                    PersonsMax = 10, Difficulty = Difficulties.High, Intensity = Intensities.High
                },
                new Activity
                {
                    ActivityId = 6, Name = "Florbal 2x2", DurationMin = 10, DurationMax = 20, PersonsMin = 4,
                    PersonsMax = 10, Difficulty = Difficulties.High, Intensity = Intensities.High
                },
                new Activity
                {
                    ActivityId = 7, Name = "Florbal 5x5", DurationMin = 10, DurationMax = 20, PersonsMin = 10,
                    PersonsMax = 30, Difficulty = Difficulties.High, Intensity = Intensities.High
                }
            );
        }

    

        private static void TrainingModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TrainingAgeGroup>().HasKey(tag => new { tag.TrainingId, tag.TrainingAgeGroupId });
            modelBuilder.Entity<TrainingAgeGroup>()
                .HasOne(tag => tag.Training)
                .WithMany(t => t.TrainingAgeGroups)
                .HasForeignKey(tag => tag.TrainingId);

            modelBuilder.Entity<TrainingAgeGroup>()
                .HasOne(tag => tag.AgeGroup)
                .WithMany(ag => ag.TrainingAgeGroups)
                .HasForeignKey(tag => tag.TrainingAgeGroupId);

            modelBuilder.Entity<TrainingPart>().HasKey(tag => tag.TrainingPartId);
            modelBuilder.Entity<TrainingPart>()
                .HasOne(tp => tp.Training)
                .WithMany(t => t.TrainingParts)
                .HasForeignKey(tp => tp.TrainingId);

            modelBuilder.Entity<TrainingGroup>().HasKey(tag => tag.TrainingGroupId);
            modelBuilder.Entity<TrainingGroup>()
                .HasOne(tg => tg.TrainingPart)
                .WithMany(tp => tp.TrainingGroups);

            modelBuilder.Entity<TrainingGroupActivity>()
                .HasOne(tg => tg.Activity)
                .WithMany(tp => tp.TrainingGroupActivities)
                .HasForeignKey(tg => tg.ActivityId);


            

        }

        private static void ActivityModelCreating(ModelBuilder modelBuilder)
        {


            modelBuilder.Entity<ActivityAgeGroup>().HasKey(aag => aag.ActivityAgeGroupId);
            modelBuilder.Entity<ActivityAgeGroup>().HasAlternateKey(aag => new { aag.ActivityId, aag.AgeGroupId });
            modelBuilder.Entity<ActivityAgeGroup>()
                .HasOne(aag => aag.Activity)
                .WithMany(a => a.ActivityAgeGroups)
                .HasForeignKey(aag => aag.ActivityId);

            modelBuilder.Entity<ActivityAgeGroup>()
                .HasOne(aag => aag.AgeGroup)
                .WithMany(ag => ag.ActivityAgeGroups)
                .HasForeignKey(am => am.AgeGroupId);


            modelBuilder.Entity<ActivityTag>().HasKey(at => at.ActivityTagId);
            modelBuilder.Entity<ActivityTag>().HasAlternateKey(at => new { at.ActivityId, at.TagId });
            modelBuilder.Entity<ActivityTag>()
                .HasOne(at => at.Activity)
                .WithMany(a => a.ActivityTags)
                .HasForeignKey(at => at.ActivityId);
            modelBuilder.Entity<ActivityTag>()
                .HasOne(at => at.Tag)
                .WithMany(t => t.ActivityTags)
                .HasForeignKey(at => at.TagId);

            modelBuilder.Entity<ActivityEquipment>().HasKey(ae => ae.ActivityEquipmentId);
            modelBuilder.Entity<ActivityEquipment>().HasAlternateKey(ae => new { ae.ActivityEquipmentId, ae.ActivityId, ae.EquipmentId });
            modelBuilder.Entity<ActivityEquipment>()
                .HasOne(ae => ae.Activity)
                .WithMany(a => a.ActivityEquipments)
                .HasForeignKey(ae => ae.ActivityId);
            modelBuilder.Entity<ActivityEquipment>()
                .HasOne(ae => ae.Equipment)
                .WithMany(e => e.ActivityEquipments)
                .HasForeignKey(ae => ae.EquipmentId);

            modelBuilder.Entity<ActivityMedia>().HasKey(am => am.ActivityMediaId);
            modelBuilder.Entity<ActivityMedia>()
                .HasOne(am => am.Activity)
                .WithMany(a => a.ActivityMedium)
                .HasForeignKey(am => am.ActivityId);

        }
    }
}
