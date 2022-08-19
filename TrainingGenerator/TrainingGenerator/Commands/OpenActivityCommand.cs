using System;
using TrainingGenerator.Models;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Commands
{
    public class OpenActivityDetailCommand : CommandBase
    {
        private readonly TeamStore _teamStore;
        private readonly ActivityDetailViewModel _activityDetailViemModel;

        public OpenActivityDetailCommand(TeamStore teamStore, ActivityDetailViewModel activityDetailViemModel)
        {
            _teamStore = teamStore;
            _activityDetailViemModel = activityDetailViemModel;
        }

        public override void Execute(object parameter)
        {
            _activityDetailViemModel.ErrorMessage = string.Empty;
            _activityDetailViemModel.IsLoading = true;

            try
            {
                var activity = ((Activity)parameter);

                if (activity != null)
                {
                    _teamStore.SelectedActivity = activity;
                    _activityDetailViemModel.OpenActivity(_teamStore.SelectedActivity);
                }
            }
            catch (Exception e)
            {
                _activityDetailViemModel.ErrorMessage = $"Chyba při načítání aktivity - {e.Message}";
            }

            _activityDetailViemModel.IsLoading = false;
        }
    }
}