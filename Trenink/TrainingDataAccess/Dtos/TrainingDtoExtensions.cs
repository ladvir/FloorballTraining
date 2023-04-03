namespace TrainingDataAccess.Dtos
{
    public static class TrainingDtoExtensions
    {
        public static List<string> GetNeededEquipment(this TrainingDto trainingDto)
        {
            var trainingTags = trainingDto.TrainingParts.SelectMany(tp => tp.TrainingGroups)
                .SelectMany(tg => tg.TrainingGroupActivities)
                .SelectMany(tga => tga.Activity.AcitvityTags);




            var x = trainingTags.Where(tag => tag.Tag.ParentTag is { Name: "Vybavení" }).Select(e => e.Tag.Name).ToList();

            return x;
        }

        public static long GetActivitiesDurationMin(this TrainingDto trainingDto)
        {
            return trainingDto.TrainingParts.SelectMany(tp => tp.TrainingGroups).SelectMany(tg => tg.TrainingGroupActivities)
                .Sum(tga => tga.Activity.DurationMin.GetValueOrDefault(0));

        }

        public static long GetActivitiesDurationMax(this TrainingDto trainingDto)
        {
            return trainingDto.TrainingParts.SelectMany(tp => tp.TrainingGroups).SelectMany(tg => tg.TrainingGroupActivities)
                .Sum(tga => tga.Activity.DurationMax.GetValueOrDefault(0));

        }
    }
}
