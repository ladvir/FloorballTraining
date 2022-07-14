using System.Collections.Generic;

namespace Domain
{
    public class Aid
    {
        public int Id{ get; set; }
        public string Name{ get; set; }
        public List<Activity> Activities { get; set; }
    }
}
