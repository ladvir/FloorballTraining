using System.Threading.Tasks;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.AcitivityDeletors
{
    public interface IActivityDeletor
    {
        Task DeleteActivity(Activity activity);
    }
}