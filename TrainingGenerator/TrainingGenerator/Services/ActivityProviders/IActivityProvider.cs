using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.ActivityProviders
{
    public interface IActivityProvider
    {
        Task<IEnumerable<Activity>> GetAllActivities();

        Task<Activity> GetActivity(int id);
    }
}