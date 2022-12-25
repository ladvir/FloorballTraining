using TrainingGenerator.Services;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Commands
{
    public class ModalNavigateCommand<TViewModel> : CommandBase where TViewModel : ViewModelBase
    {
        private readonly ModalNavigationService<TViewModel> _modalNavigationService;

        public ModalNavigateCommand(ModalNavigationService<TViewModel> modalNavigationService)
        {
            _modalNavigationService = modalNavigationService;
        }

        public override void Execute(object? parameter)
        {
            _modalNavigationService.Navigate();
        }
    }
}