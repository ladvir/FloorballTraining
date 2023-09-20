﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class ActivityTag
    {
        [Key]
        [Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ActivityTagId { get; set; }
        public int ActivityId { get; set; }
        public Activity? Activity { get; set; }

        public int TagId { get; set; }
        public Tag? Tag { get; set; }
    }
}
