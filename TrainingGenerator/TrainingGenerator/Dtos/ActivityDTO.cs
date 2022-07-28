using System;
using System.ComponentModel.DataAnnotations;
using TrainingGenerator.Models;

namespace TrainingGenerator.Dtos
{
    public class ActivityDTO
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public double? Rating { get; set; }
        public int? Duration { get; set; }
        public int? PersonsMin { get; set; }
        public int? PersonsMax { get; set; }

        internal Activity ToActivity()
        {
            throw new NotImplementedException();
        }
    }
}