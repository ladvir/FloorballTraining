﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class Media
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MediaId { get; set; }
        [Required]
        public string Path { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public MediaType MediaType { get; set; }

        public string Preview { get; set; } = string.Empty;

        public string Data { get; set; } = string.Empty;

        public List<ActivityMedia> ActivityMedium { get; set; } = new();

        public Media Clone()
        {
            return new Media
            {
                MediaId = MediaId,
                Path = Path,
                Name = Name,
                MediaType = MediaType,
                Preview = Preview,
                Data = Data
            };
        }

        public void Merge(Media media)
        {
            Path = media.Path;
            Name = media.Name;
            MediaType = media.MediaType;
            Preview = media.Preview;
            Data = media.Data;
        }
    }


    public enum MediaType
    {
        Image,
        Video,
        URL
    }
}