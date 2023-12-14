using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config
{

    public class TagConfiguration : IEntityTypeConfiguration<Tag>
    {
        public void Configure(EntityTypeBuilder<Tag> builder)
        {
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.IsTrainingGoal).IsRequired().HasDefaultValue(false);

            builder.HasMany(t => t.ActivityTags).WithOne(at => at.Tag).HasForeignKey(a => a.TagId);
            builder.HasMany(t => t.Training).WithOne(t => t.TrainingGoal).HasForeignKey(a => a.TrainingGoalId);
        }
    }

    public class EquipmentConfiguration : IEntityTypeConfiguration<Equipment>
    {
        public void Configure(EntityTypeBuilder<Equipment> builder)
        {
            builder.Property(p => p.Id).IsRequired();

            builder.HasMany(t => t.ActivityEquipments).WithOne(at => at.Equipment).HasForeignKey(a => a.EquipmentId);
        }
    }

    public class AgeGroupConfiguration : IEntityTypeConfiguration<AgeGroup>
    {
        public void Configure(EntityTypeBuilder<AgeGroup> builder)
        {
            builder.Property(p => p.Id).IsRequired();

            builder.HasMany(t => t.ActivityAgeGroups).WithOne(at => at.AgeGroup).HasForeignKey(a => a.AgeGroupId);
            builder.HasMany(t => t.TrainingAgeGroups).WithOne(at => at.AgeGroup).HasForeignKey(a => a.AgeGroupId);
        }
    }

    public class PlaceConfiguration : IEntityTypeConfiguration<Place>
    {
        public void Configure(EntityTypeBuilder<Place> builder)
        {
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.Name).IsRequired();
            builder.Property(p => p.Environment).IsRequired();


            builder.HasMany(t => t.Trainings).WithOne().HasForeignKey(a => a.PlaceId);
        }
    }

    public class ActivityConfiguration : IEntityTypeConfiguration<Activity>
    {
        public void Configure(EntityTypeBuilder<Activity> builder)
        {
            builder.Property(p => p.Id).IsRequired();

            builder.HasMany(a => a.ActivityTags).WithOne(a => a.Activity).HasForeignKey(t => t.ActivityId);
            builder.HasMany(a => a.ActivityEquipments).WithOne(a => a.Activity).HasForeignKey(t => t.ActivityId);
            builder.HasMany(a => a.ActivityMedium).WithOne(a => a.Activity).HasForeignKey(t => t.ActivityId);

            builder.HasMany(a => a.ActivityAgeGroups).WithOne(a => a.Activity).HasForeignKey(t => t.ActivityId);
            // builder.HasOne(a => a.TrainingGroup).WithOne(a => a.Activity);//.HasForeignKey(t => t.ActivityId);
        }
    }


    //public class ActivityTagConfiguration : IEntityTypeConfiguration<ActivityTag>
    //{
    //    public void Configure(EntityTypeBuilder<ActivityTag> builder)
    //    {
    //        builder.Property(p => p.Id).IsRequired();

    //        builder.HasOne(a => a.Activity).WithMany().HasForeignKey(t => t.ActivityId);
    //        builder.HasOne(a => a.Tag).WithMany().HasForeignKey(t => t.TagId);
    //    }
    //}

    //public class ActivityMediaConfiguration : IEntityTypeConfiguration<ActivityMedia>
    //{
    //    public void Configure(EntityTypeBuilder<ActivityMedia> builder)
    //    {
    //        builder.Property(p => p.Id).IsRequired();

    //        builder.HasOne(a => a.Activity).WithMany().HasForeignKey(t => t.ActivityId);

    //    }
    //}

    //public class ActivityEquipmentConfiguration : IEntityTypeConfiguration<ActivityEquipment>
    //{
    //    public void Configure(EntityTypeBuilder<ActivityEquipment> builder)
    //    {
    //        builder.Property(p => p.Id).IsRequired();

    //        builder.HasOne(a => a.Activity).WithMany().HasForeignKey(t => t.ActivityId);
    //        builder.HasOne(a => a.Equipment).WithMany().HasForeignKey(t => t.EquipmentId);
    //    }
    //}

    public class TrainingConfiguration : IEntityTypeConfiguration<Training>
    {
        public void Configure(EntityTypeBuilder<Training> builder)
        {
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.Name).IsRequired();
            //builder.Property(p => p.Place).IsRequired();

            builder.HasOne(t => t.Place).WithMany(x => x.Trainings).HasForeignKey(x => x.PlaceId);
            builder.HasMany(t => t.TrainingAgeGroups).WithOne(a => a.Training).HasForeignKey(a => a.TrainingId);
            builder.HasMany(t => t.TrainingParts).WithOne(a => a.Training).HasForeignKey(a => a.TrainingId);
        }
    }


    //public class TrainingAgeGroupConfiguration : IEntityTypeConfiguration<TrainingAgeGroup>
    //{
    //    public void Configure(EntityTypeBuilder<TrainingAgeGroup> builder)
    //    {
    //        builder.Property(p => p.Id).IsRequired();

    //        builder.HasOne(t => t.Training).WithMany().HasForeignKey(a => a.TrainingId);
    //        builder.HasOne(t => t.AgeGroup).WithMany().HasForeignKey(a => a.AgeGroupId);
    //    }
    //}


    public class TrainingPartConfiguration : IEntityTypeConfiguration<TrainingPart>
    {
        public void Configure(EntityTypeBuilder<TrainingPart> builder)
        {
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.Name).IsRequired();

            builder.HasMany(t => t.TrainingGroups).WithOne(a => a.TrainingPart).HasForeignKey(a => a.TrainingPartId);
            builder.HasOne(t => t.Training).WithMany(a => a.TrainingParts).HasForeignKey(a => a.TrainingId);
        }
    }


    public class TrainingGroupConfiguration : IEntityTypeConfiguration<TrainingGroup>
    {
        public void Configure(EntityTypeBuilder<TrainingGroup> builder)
        {
            builder.Property(p => p.Id).IsRequired();
            builder.HasOne(t => t.TrainingPart).WithMany(at => at.TrainingGroups).HasForeignKey(x => x.TrainingPartId);
        }
    }


    //public class TrainingGroupActivityConfiguration : IEntityTypeConfiguration<TrainingGroupActivity>
    //{
    //    public void Configure(EntityTypeBuilder<TrainingGroupActivity> builder)
    //    {
    //        builder.Property(p => p.Id).IsRequired();

    //        builder.HasOne(t => t.Activity).WithMany(at => at.TrainingGroupActivities).HasForeignKey(a => a.ActivityId);
    //        builder.HasOne(t => t.TrainingGroup).WithOne(at => at.TrainingGroupActivity);
    //    }
    //}

}
