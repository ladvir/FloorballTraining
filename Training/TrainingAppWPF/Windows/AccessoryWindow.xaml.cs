using Domain;
using Repository;
using System;
using System.Windows;
using System.Windows.Input;

namespace TrainingAppWPF.Windows
{
    /// <summary>
    /// Interaction logic for AccessoryWindow.xaml
    /// </summary>
    public partial class AccessoryWindow : Window
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
    }
}
