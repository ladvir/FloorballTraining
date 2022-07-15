using System.Collections.Generic;

namespace Domain
{
    public class Accessory
    {
        public int Id{ get; set; }
        public string Name{ get; set; }
        public List<Activity> Activities { get; set; }
    }
}
