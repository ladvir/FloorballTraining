﻿using System;
using System.Threading.Tasks;
using System.Windows;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Commands
{
    public class AddActivityCommand : AsyncCommandBase
    {
        private readonly AddActivityViewModel _addActivityViewModel;
        private readonly NavigationService _activityListingNavigationService;
        private readonly TeamStore _teamStore;

        public AddActivityCommand(TeamStore teamStore, AddActivityViewModel addActivityViewModel, NavigationService activityListingNavigationService)
        {
            _addActivityViewModel = addActivityViewModel;
            _activityListingNavigationService = activityListingNavigationService;
            _teamStore = teamStore;
        }

        public override bool CanExecute(object parameter)
        {
            return base.CanExecute(parameter);
        }

        public override async Task ExecuteAsync(object parameter)
        {
            var activity = new Activity(
                _addActivityViewModel.Name,
                _addActivityViewModel.Description,
                null,
                _addActivityViewModel.PersonsMin,
                _addActivityViewModel.PersonsMax,
                _addActivityViewModel.Duration
            );

            try
            {
                await _teamStore.AddActivity(activity);

                _activityListingNavigationService.Navigate();
            }
            catch (Exception e)
            {
                MessageBox.Show($"Chyba při ukládání nové aktivity - {e.Message} - {e.InnerException?.Message}", "Chyba", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}