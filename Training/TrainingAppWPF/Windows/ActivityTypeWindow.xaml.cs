using Domain;
using Repository;
using System;
using System.Windows;
using System.Windows.Input;

namespace TrainingAppWPF.Windows
{
    public partial class ActivityTypeWindow : Window
    {

        private readonly ActivityTypeRepository _activityTypeRepository = new ActivityTypeRepository(Helper.ConnectionStringValue("Training"));
        public ActivityType ActivityType { get; set; }
        private readonly string _originalText;

        public ActivityTypeWindow(ActivityType activityType)
        {
            Owner = Application.Current.MainWindow;

            ActivityType = activityType;

            _originalText = activityType.Name;
            InitializeComponent();
        }

        private void CancelButton_OnClick(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void SaveButton_OnClick(object sender, RoutedEventArgs e)
        {
            Save();
        }

        private void Save()
        {
            try
            {
                if (NameTextBox.Text != _originalText)
                    _activityTypeRepository.Update(ActivityType.Id, NameTextBox.Text);

                Close();
            }
            catch (Exception x)
            {
                MessageBox.Show(x.Message);
            }
        }

        private void OnKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                Save();
            }

            if (e.Key == Key.Escape)
            {
                Close();
            }
        }

        private void DeleteButton_OnClick(object sender, RoutedEventArgs e)
        {

            if (ActivityType.ActivitiesCount != 0)
            {
                MessageBox.Show($"Typ aktivity nelze smazat. Je používána v {ActivityType.ActivitiesCount} aktivitách");
                return;
            }

            MessageBoxResult messageBoxResult = MessageBox.Show($"Opravdu chcete smazat {ActivityType.Name}?", "Smazat", MessageBoxButton.YesNo);
            if (messageBoxResult == MessageBoxResult.Yes)

                try
                {
                    _activityTypeRepository.Delete(ActivityType.Id);
                    Close();
                }
                catch (Exception x)
                {
                    MessageBox.Show(x.Message);
                }
        }
    }
}
