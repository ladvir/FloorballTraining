using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.AcitivityDeletors
{
    public interface IActivityService
    {
        Task DeleteActivity(Activity activity);

        Task CreateActivity(Activity activity);

        Task<IEnumerable<Activity>> GetAllActivities();

        Task<Activity> GetActivity(int id);

        Task UpdateActivity(Activity activity);
    }
}