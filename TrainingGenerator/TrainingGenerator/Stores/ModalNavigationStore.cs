﻿using System;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Stores
{
    public class ModalNavigationStore
    {
        private ViewModelBase? _currentViewModel;

        public ViewModelBase? CurrentViewModel
        {
            get => _currentViewModel;
            set
            {
                _currentViewModel?.Dispose();
                _currentViewModel = value;
                OnCurrentViewModelChanged();
            }
        }
        public bool IsOpen => CurrentViewModel != null;

        public void Close()
        {
            CurrentViewModel = null;
        }
        public event Action CurrentViewModelChanged;

        private void OnCurrentViewModelChanged()
        {
            CurrentViewModelChanged?.Invoke();
        }
    }
}