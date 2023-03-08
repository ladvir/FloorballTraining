/*using System.ComponentModel.DataAnnotations.Schema;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Dtos;

public class TrainingPartDto
{
    public int TrainingPartId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public List<ActivityDto> Activities { get; set; } = new List<ActivityDto>();

    public List<Training> Trainings { get; set; } = new List<Training>();

    public List<TrainingPartActivity> TrainingPartActivities { get; set; } = new List<TrainingPartActivity>();


    [NotMapped]
    public int TrainingPartType { get; set; }


    public TrainingPartDto()
    {
    }

    public TrainingPartDto(string name)
    {
        Name = name;
    }



}*/