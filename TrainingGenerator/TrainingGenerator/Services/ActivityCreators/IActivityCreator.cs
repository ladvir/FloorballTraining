using System.Threading.Tasks;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.ActivityCreators
{
    public interface IActivityCreator
    {
        Task CreateActivity(Activity activity);
    }
}