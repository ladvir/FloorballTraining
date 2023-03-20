namespace TrainingDataAccess.Models.Factories;

public interface IFactory<out T, in TDto>
    where T : class
    where TDto : class
{
    //T GetMergedOrBuild(TDto dto);
    T Build(TDto dto);
}