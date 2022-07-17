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
    /// <summary>
    /// Interaction logic for Activity.xaml
    /// </summary>
    public partial class ActivityPage : Page
    {
        public IEnumerable<Activity> Activities = new List<Activity>();

        private readonly ActivityRepository _activityRepository = new ActivityRepository(Helper.ConnectionStringValue("Training"));

        private Activity _selectedActivity;
        public ActivityPage()
        {
            InitializeComponent();
            GetActivities();
            UpdateBinding();
        }

        private void UpdateBinding()
        {
            ActivitiesDataGrid.ItemsSource = Activities;
        }


        private void NewButton_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(SearchTextBox.Text)) return;

            try
            {
                _activityRepository.Insert(SearchTextBox.Text.Normalize());
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
            if (_selectedActivity != null)
            {
                OpenActivityWindow();

                GetActivities();
                return;
            }

            UpdateBinding();
        }

        private void OpenActivityWindow()
        {
            var activityWindow = new ActivityWindow(_selectedActivity);
            activityWindow.ShowDialog();

            _selectedActivity = null;
            GetActivities();
        }

        private void DeleteButton_Click(object sender, RoutedEventArgs e)
        {
            if (_selectedActivity != null && _selectedActivity.Trainings.Count != 0)
            {
                MessageBoxResult messageBoxResult = MessageBox.Show($"Opravdu chcete smazat {_selectedActivity.Name}?", "Smazat", MessageBoxButton.YesNo);
                if (messageBoxResult == MessageBoxResult.Yes)

                    try
                    {
                        _activityRepository.Delete(_selectedActivity.Id);
                    }
                    catch (Exception x)
                    {
                        MessageBox.Show(x.Message);
                    }
                _selectedActivity = null;

                GetActivities();
                return;
            }
            UpdateBinding();
        }

        private void SearchTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            GetActivities();
        }

        private void GetActivities()
        {
            try
            {
                Activities = !string.IsNullOrEmpty(SearchTextBox.Text)
                    ? _activityRepository.GetActivitiesByName(SearchTextBox.Text)
                    : _activityRepository.GetAllActivities();
            }
            catch (Exception x)
            {
                MessageBox.Show(x.Message);
            }

            UpdateBinding();
        }

        private void ActivitiesDataGrid_OnSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var grid = (DataGrid)sender;

            if (grid.SelectedItem is Activity Activity) _selectedActivity = Activity;
        }

        private void ActivitiesDataGrid_OnMouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            var grid = (DataGrid)sender;

            if (grid.SelectedItem is Activity Activity) _selectedActivity = Activity;

            OpenActivityWindow();

        }
    }
}
