using Domain;
using Repository;
using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using TrainingAppWPF.Windows;

namespace TrainingAppWPF.Pages
{
    public partial class ActivityTypePage : Page
    {
        public IEnumerable<ActivityType> ActivityTypes = new List<ActivityType>();
        private readonly ActivityTypeRepository _activityTypeRepository = new ActivityTypeRepository(Helper.ConnectionStringValue("Training"));

        private ActivityType _selectedActivityType;

        public ActivityTypePage()
        {
            InitializeComponent();

            GetActivityTypes();
        }

        private void UpdateBinding()
        {
            ActivityTypeDataGrid.ItemsSource = ActivityTypes;
        }


        private void NewButton_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(SearchTextBox.Text)) return;

            try
            {
                _activityTypeRepository.Insert(SearchTextBox.Text.Normalize());
            }
            catch (Exception x)
            {
                MessageBox.Show(x.Message);
            }

            UpdateBinding();
            SearchTextBox.Text = string.Empty;
        }

        private void EditButton_Click(object sender, RoutedEventArgs e)
        {
            if (_selectedActivityType != null)
            {
                OpenActivityTypeWindow();

                GetActivityTypes();
                return;
            }

            UpdateBinding();
        }

        private void OpenActivityTypeWindow()
        {
            var activityTypeWindow = new ActivityTypeWindow(_selectedActivityType);
            activityTypeWindow.ShowDialog();

            _selectedActivityType = null;
            GetActivityTypes();


        }

        private void DeleteButton_Click(object sender, RoutedEventArgs e)
        {
            if (_selectedActivityType != null && _selectedActivityType.ActivitiesCount == 0)
            {
                MessageBoxResult messageBoxResult = MessageBox.Show($"Opravdu chcete smazat {_selectedActivityType.Name}?", "Smazat", MessageBoxButton.YesNo);
                if (messageBoxResult == MessageBoxResult.Yes)

                    try
                    {
                        _activityTypeRepository.Delete(_selectedActivityType.Id);
                    }
                    catch (Exception x)
                    {
                        MessageBox.Show(x.Message);
                    }
                _selectedActivityType = null;

                GetActivityTypes();
                return;
            }
            UpdateBinding();
        }

        private void SearchTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            GetActivityTypes();
        }

        private void GetActivityTypes()
        {
            try
            {
                ActivityTypes = !string.IsNullOrEmpty(SearchTextBox.Text)
                    ? _activityTypeRepository.GetActivityTypesByName(SearchTextBox.Text)
                    : _activityTypeRepository.GetAllActivityTypes();
            }
            catch (Exception x)
            {
                MessageBox.Show(x.Message);
            }

            UpdateBinding();
        }

        private void ActivityTypeDataGrid_OnSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var grid = (DataGrid)sender;

            if (grid.SelectedItem is ActivityType activityType) _selectedActivityType = activityType;
        }

        private void ActivityTypeDataGrid_OnMouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            var grid = (DataGrid)sender;

            if (grid.SelectedItem is ActivityType activityType) _selectedActivityType = activityType;

            OpenActivityTypeWindow();

        }
    }
}
