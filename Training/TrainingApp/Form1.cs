using Domain;
using Repository;
using System;
using System.Collections.Generic;
using System.Windows.Forms;

namespace TrainingApp
{
    public partial class Dashboard : Form
    {
        private List<Activity> _activities = new List<Activity>();

        private Activity _selectedActivity;
        public Dashboard()
        {
            InitializeComponent();
            UpdateBindings();
        }

        private void UpdateBindings()
        {
            ActivityListBox.DataSource = _activities;
            ActivityListBox.DisplayMember = "FullInfo";


            if (_selectedActivity == null) return;


            ActivityNameTextBox.Text = _selectedActivity.Name;
            ActivityDescriptionTextBox.Text = _selectedActivity.Description;
            ActivityPersonsMaxUpDown.Value = _selectedActivity.PersonsMax;
            ActivityPersonsMinUpDown.Value = _selectedActivity.PersonsMin;
            ActivityDurationUpDown.Value = _selectedActivity.Duration;
            ActivityRatingUpDown.Value = (decimal)_selectedActivity.Rating;

        }

        private void SearchButton_Click(object sender, EventArgs e)
        {
            GetActivities();
        }

        private void Dashboard_Load(object sender, EventArgs e)
        {
            GetActivities();
        }


        private void GetActivities()
        {
            var repository = new ActivityRepository(Helper.ConnectionStringValue("Training"));

            _activities = repository.GetActivities();

            UpdateBindings();
        }


        private void AcitvitySave_Click(object sender, EventArgs e)
        {
            var activity = new Activity
            {


            };
        }

        private void ActivityPersonMinTextBox_ValueChanged(object sender, EventArgs e)
        {
            if (ActivityPersonsMinUpDown.Value > ActivityPersonsMaxUpDown.Value)
            {
                ActivityPersonsMaxUpDown.Value = ActivityPersonsMinUpDown.Value;
            }
        }


        private void ActivityPersonsMaxUpDown_ValueChanged(object sender, EventArgs e)
        {
            if (ActivityPersonsMaxUpDown.Value < ActivityPersonsMinUpDown.Value)
            {
                ActivityPersonsMinUpDown.Value = ActivityPersonsMaxUpDown.Value;
            }
        }

        private void ActivityListBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            _selectedActivity = (Activity)ActivityListBox.SelectedItem;

            UpdateBindings();
        }
    }
}
