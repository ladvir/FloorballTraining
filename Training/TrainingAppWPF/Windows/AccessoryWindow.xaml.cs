using Domain;
using Repository;
using System;
using System.Windows;
using System.Windows.Input;

namespace TrainingAppWPF.Windows
{
    sapublic partial class AccessoryWindow : Window
    {

        private readonly AccessoryRepository _accessoryRepository = new AccessoryRepository(Helper.ConnectionStringValue("Training"));
        public Accessory Accessory { get; set; }
        private readonly string _originalText;

        public AccessoryWindow(Accessory accessory)
        {
            Owner = Application.Current.MainWindow;

            Accessory = accessory;

            _originalText = Accessory.Name;
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
                    _accessoryRepository.Update(Accessory.Id, NameTextBox.Text);

                Close();
            }
            catch (Exception x)
            {
                MessageBox.Show(x.Message);
            }
        }

        private void NameTextBox_OnKeyDown(object sender, KeyEventArgs e)
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

        private void DeleteButton_OnClickButton_OnClick(object sender, RoutedEventArgs e)
        {

            if (Accessory.ActivitiesCount != 0)
            {
                MessageBox.Show($"Pomůcku nelze smazat. Je používána v {Accessory.ActivitiesCount} aktivitách");
                return;
            }

            MessageBoxResult messageBoxResult = MessageBox.Show($"Opravdu chcete smazat {Accessory.Name}?", "Smazat", MessageBoxButton.YesNo);
            if (messageBoxResult == MessageBoxResult.Yes)

                try
                {
                    _accessoryRepository.Delete(Accessory.Id);
                }
                catch (Exception x)
                {
                    MessageBox.Show(x.Message);
                }
        }
    }
}
