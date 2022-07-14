using Repository;
using System.Collections.Generic;
using System.Windows.Controls;


namespace TrainingAppWPF.Pages
{
    /// <summary>
    /// Interaction logic for Activity.xaml
    /// </summary>
    public partial class ActivityPage : Page
    {
        private List<Domain.Activity> _activities = new List<Domain.Activity>();

        private Domain.Activity _selectedActivity;
        public ActivityPage()
        {
            InitializeComponent();
            GetActivities();
            UpdateBindings();
        }

        private void UpdateBindings()
        {
            ActivityListBox.ItemsSource = _activities;

            if (_selectedActivity == null) return;


            /* ActivityNameTextBox.Text = _selectedActivity.Name;
             ActivityDescriptionTextBox.Text = _selectedActivity.Description;
             ActivityPersonsMaxUpDown.Value = _selectedActivity.PersonsMax;
             ActivityPersonsMinUpDown.Value = _selectedActivity.PersonsMin;
             ActivityDurationUpDown.Value = _selectedActivity.Duration;
             ActivityRatingUpDown.Value = (decimal)_selectedActivity.Rating;*/

        }

        private void GetActivities()
        {
            var repository = new ActivityRepository(Helper.ConnectionStringValue("Training"));

            _activities = repository.GetActivities();

        }

        private void ActivityListBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ActivityListBox.SelectedItem != null)
                _selectedActivity = (Domain.Activity)ActivityListBox.SelectedItem;
        }
    }
}
