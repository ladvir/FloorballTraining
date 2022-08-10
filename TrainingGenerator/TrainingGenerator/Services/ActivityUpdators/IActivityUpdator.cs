using System.Threading.Tasks;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.ActivityUpdators
{
    public interface IActivityUpdator
    {
        Task UpdateActivity(Activity activity);
    }
}