
namespace TrainingApp
{
    partial class Dashboard
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.ActivityListBox = new System.Windows.Forms.ListBox();
            this.ActvityLabel = new System.Windows.Forms.Label();
            this.SearchButton = new System.Windows.Forms.Button();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.ActivityPicture = new System.Windows.Forms.PictureBox();
            this.ActivityAidsCheckBoxList = new System.Windows.Forms.CheckedListBox();
            this.ActivityAimsCheckBoxList = new System.Windows.Forms.CheckedListBox();
            this.ActivityRatingUpDown = new System.Windows.Forms.NumericUpDown();
            this.ActivityPersonsMaxUpDown = new System.Windows.Forms.NumericUpDown();
            this.ActivityPersonsMinUpDown = new System.Windows.Forms.NumericUpDown();
            this.ActivityDurationUpDown = new System.Windows.Forms.NumericUpDown();
            this.ActivityDescriptionTextBox = new System.Windows.Forms.TextBox();
            this.ActivityNameTextBox = new System.Windows.Forms.TextBox();
            this.ActivityAidsLabel = new System.Windows.Forms.Label();
            this.ActivityAimsLabel = new System.Windows.Forms.Label();
            this.ActivityRatingLabel = new System.Windows.Forms.Label();
            this.ActivityDurationLabel = new System.Windows.Forms.Label();
            this.ActivityPictureLabel = new System.Windows.Forms.Label();
            this.ActivityPersonsMaxLabel = new System.Windows.Forms.Label();
            this.ActivityPersonsMinLabel = new System.Windows.Forms.Label();
            this.ActivityDescriptionLabel = new System.Windows.Forms.Label();
            this.ActivityNameLabel = new System.Windows.Forms.Label();
            this.AcitvitySave = new System.Windows.Forms.Button();
            this.groupBox1.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityPicture)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityRatingUpDown)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityPersonsMaxUpDown)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityPersonsMinUpDown)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityDurationUpDown)).BeginInit();
            this.SuspendLayout();
            // 
            // ActivityListBox
            // 
            this.ActivityListBox.FormattingEnabled = true;
            this.ActivityListBox.ItemHeight = 19;
            this.ActivityListBox.Location = new System.Drawing.Point(29, 47);
            this.ActivityListBox.Name = "ActivityListBox";
            this.ActivityListBox.Size = new System.Drawing.Size(488, 897);
            this.ActivityListBox.TabIndex = 0;
            this.ActivityListBox.SelectedIndexChanged += new System.EventHandler(this.ActivityListBox_SelectedIndexChanged);
            // 
            // ActvityLabel
            // 
            this.ActvityLabel.AutoSize = true;
            this.ActvityLabel.Location = new System.Drawing.Point(29, 25);
            this.ActvityLabel.Name = "ActvityLabel";
            this.ActvityLabel.Size = new System.Drawing.Size(55, 19);
            this.ActvityLabel.TabIndex = 1;
            this.ActvityLabel.Text = "Aktivity";
            // 
            // SearchButton
            // 
            this.SearchButton.Location = new System.Drawing.Point(572, 47);
            this.SearchButton.Name = "SearchButton";
            this.SearchButton.Size = new System.Drawing.Size(100, 32);
            this.SearchButton.TabIndex = 2;
            this.SearchButton.Text = "Hledej";
            this.SearchButton.UseVisualStyleBackColor = true;
            this.SearchButton.Click += new System.EventHandler(this.SearchButton_Click);
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.ActivityPicture);
            this.groupBox1.Controls.Add(this.ActivityAidsCheckBoxList);
            this.groupBox1.Controls.Add(this.ActivityAimsCheckBoxList);
            this.groupBox1.Controls.Add(this.ActivityRatingUpDown);
            this.groupBox1.Controls.Add(this.ActivityPersonsMaxUpDown);
            this.groupBox1.Controls.Add(this.ActivityPersonsMinUpDown);
            this.groupBox1.Controls.Add(this.ActivityDurationUpDown);
            this.groupBox1.Controls.Add(this.ActivityDescriptionTextBox);
            this.groupBox1.Controls.Add(this.ActivityNameTextBox);
            this.groupBox1.Controls.Add(this.ActivityAidsLabel);
            this.groupBox1.Controls.Add(this.ActivityAimsLabel);
            this.groupBox1.Controls.Add(this.ActivityRatingLabel);
            this.groupBox1.Controls.Add(this.ActivityDurationLabel);
            this.groupBox1.Controls.Add(this.ActivityPictureLabel);
            this.groupBox1.Controls.Add(this.ActivityPersonsMaxLabel);
            this.groupBox1.Controls.Add(this.ActivityPersonsMinLabel);
            this.groupBox1.Controls.Add(this.ActivityDescriptionLabel);
            this.groupBox1.Controls.Add(this.ActivityNameLabel);
            this.groupBox1.Controls.Add(this.AcitvitySave);
            this.groupBox1.Location = new System.Drawing.Point(731, 50);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(930, 459);
            this.groupBox1.TabIndex = 3;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Activita";
            // 
            // ActivityPicture
            // 
            this.ActivityPicture.Location = new System.Drawing.Point(141, 267);
            this.ActivityPicture.Name = "ActivityPicture";
            this.ActivityPicture.Size = new System.Drawing.Size(327, 186);
            this.ActivityPicture.TabIndex = 6;
            this.ActivityPicture.TabStop = false;
            // 
            // ActivityAidsCheckBoxList
            // 
            this.ActivityAidsCheckBoxList.FormattingEnabled = true;
            this.ActivityAidsCheckBoxList.Location = new System.Drawing.Point(587, 193);
            this.ActivityAidsCheckBoxList.Name = "ActivityAidsCheckBoxList";
            this.ActivityAidsCheckBoxList.Size = new System.Drawing.Size(236, 130);
            this.ActivityAidsCheckBoxList.TabIndex = 5;
            // 
            // ActivityAimsCheckBoxList
            // 
            this.ActivityAimsCheckBoxList.FormattingEnabled = true;
            this.ActivityAimsCheckBoxList.Location = new System.Drawing.Point(587, 75);
            this.ActivityAimsCheckBoxList.Name = "ActivityAimsCheckBoxList";
            this.ActivityAimsCheckBoxList.Size = new System.Drawing.Size(236, 88);
            this.ActivityAimsCheckBoxList.TabIndex = 4;
            // 
            // ActivityRatingUpDown
            // 
            this.ActivityRatingUpDown.DecimalPlaces = 2;
            this.ActivityRatingUpDown.Increment = new decimal(new int[] {
            25,
            0,
            0,
            131072});
            this.ActivityRatingUpDown.Location = new System.Drawing.Point(587, 24);
            this.ActivityRatingUpDown.Maximum = new decimal(new int[] {
            5,
            0,
            0,
            0});
            this.ActivityRatingUpDown.Name = "ActivityRatingUpDown";
            this.ActivityRatingUpDown.Size = new System.Drawing.Size(120, 26);
            this.ActivityRatingUpDown.TabIndex = 3;
            // 
            // ActivityPersonsMaxUpDown
            // 
            this.ActivityPersonsMaxUpDown.Location = new System.Drawing.Point(141, 216);
            this.ActivityPersonsMaxUpDown.Maximum = new decimal(new int[] {
            30,
            0,
            0,
            0});
            this.ActivityPersonsMaxUpDown.Minimum = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.ActivityPersonsMaxUpDown.Name = "ActivityPersonsMaxUpDown";
            this.ActivityPersonsMaxUpDown.Size = new System.Drawing.Size(42, 26);
            this.ActivityPersonsMaxUpDown.TabIndex = 3;
            this.ActivityPersonsMaxUpDown.Value = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.ActivityPersonsMaxUpDown.ValueChanged += new System.EventHandler(this.ActivityPersonsMaxUpDown_ValueChanged);
            // 
            // ActivityPersonsMinUpDown
            // 
            this.ActivityPersonsMinUpDown.Location = new System.Drawing.Point(141, 175);
            this.ActivityPersonsMinUpDown.Maximum = new decimal(new int[] {
            30,
            0,
            0,
            0});
            this.ActivityPersonsMinUpDown.Minimum = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.ActivityPersonsMinUpDown.Name = "ActivityPersonsMinUpDown";
            this.ActivityPersonsMinUpDown.Size = new System.Drawing.Size(42, 26);
            this.ActivityPersonsMinUpDown.TabIndex = 3;
            this.ActivityPersonsMinUpDown.Value = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.ActivityPersonsMinUpDown.ValueChanged += new System.EventHandler(this.ActivityPersonMinTextBox_ValueChanged);
            // 
            // ActivityDurationUpDown
            // 
            this.ActivityDurationUpDown.Location = new System.Drawing.Point(141, 137);
            this.ActivityDurationUpDown.Maximum = new decimal(new int[] {
            30,
            0,
            0,
            0});
            this.ActivityDurationUpDown.Minimum = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.ActivityDurationUpDown.Name = "ActivityDurationUpDown";
            this.ActivityDurationUpDown.Size = new System.Drawing.Size(42, 26);
            this.ActivityDurationUpDown.TabIndex = 3;
            this.ActivityDurationUpDown.Value = new decimal(new int[] {
            5,
            0,
            0,
            0});
            // 
            // ActivityDescriptionTextBox
            // 
            this.ActivityDescriptionTextBox.Location = new System.Drawing.Point(141, 60);
            this.ActivityDescriptionTextBox.Multiline = true;
            this.ActivityDescriptionTextBox.Name = "ActivityDescriptionTextBox";
            this.ActivityDescriptionTextBox.Size = new System.Drawing.Size(327, 63);
            this.ActivityDescriptionTextBox.TabIndex = 2;
            // 
            // ActivityNameTextBox
            // 
            this.ActivityNameTextBox.Location = new System.Drawing.Point(141, 28);
            this.ActivityNameTextBox.Name = "ActivityNameTextBox";
            this.ActivityNameTextBox.Size = new System.Drawing.Size(327, 26);
            this.ActivityNameTextBox.TabIndex = 2;
            // 
            // ActivityAidsLabel
            // 
            this.ActivityAidsLabel.AutoSize = true;
            this.ActivityAidsLabel.Location = new System.Drawing.Point(488, 196);
            this.ActivityAidsLabel.Name = "ActivityAidsLabel";
            this.ActivityAidsLabel.Size = new System.Drawing.Size(64, 19);
            this.ActivityAidsLabel.TabIndex = 1;
            this.ActivityAidsLabel.Text = "Pomůcky";
            // 
            // ActivityAimsLabel
            // 
            this.ActivityAimsLabel.AutoSize = true;
            this.ActivityAimsLabel.Location = new System.Drawing.Point(486, 76);
            this.ActivityAimsLabel.Name = "ActivityAimsLabel";
            this.ActivityAimsLabel.Size = new System.Drawing.Size(66, 19);
            this.ActivityAimsLabel.TabIndex = 1;
            this.ActivityAimsLabel.Text = "Zaměření";
            // 
            // ActivityRatingLabel
            // 
            this.ActivityRatingLabel.AutoSize = true;
            this.ActivityRatingLabel.Location = new System.Drawing.Point(486, 31);
            this.ActivityRatingLabel.Name = "ActivityRatingLabel";
            this.ActivityRatingLabel.Size = new System.Drawing.Size(75, 19);
            this.ActivityRatingLabel.TabIndex = 1;
            this.ActivityRatingLabel.Text = "Hodnocení";
            // 
            // ActivityDurationLabel
            // 
            this.ActivityDurationLabel.AutoSize = true;
            this.ActivityDurationLabel.Location = new System.Drawing.Point(17, 145);
            this.ActivityDurationLabel.Name = "ActivityDurationLabel";
            this.ActivityDurationLabel.Size = new System.Drawing.Size(117, 19);
            this.ActivityDurationLabel.TabIndex = 1;
            this.ActivityDurationLabel.Text = "Trvání v minutách";
            // 
            // ActivityPictureLabel
            // 
            this.ActivityPictureLabel.AutoSize = true;
            this.ActivityPictureLabel.Location = new System.Drawing.Point(17, 267);
            this.ActivityPictureLabel.Name = "ActivityPictureLabel";
            this.ActivityPictureLabel.Size = new System.Drawing.Size(60, 19);
            this.ActivityPictureLabel.TabIndex = 1;
            this.ActivityPictureLabel.Text = "Obrázek";
            // 
            // ActivityPersonsMaxLabel
            // 
            this.ActivityPersonsMaxLabel.AutoSize = true;
            this.ActivityPersonsMaxLabel.Location = new System.Drawing.Point(17, 218);
            this.ActivityPersonsMaxLabel.Name = "ActivityPersonsMaxLabel";
            this.ActivityPersonsMaxLabel.Size = new System.Drawing.Size(108, 19);
            this.ActivityPersonsMaxLabel.TabIndex = 1;
            this.ActivityPersonsMaxLabel.Text = "Počet osob max.";
            // 
            // ActivityPersonsMinLabel
            // 
            this.ActivityPersonsMinLabel.AutoSize = true;
            this.ActivityPersonsMinLabel.Location = new System.Drawing.Point(17, 182);
            this.ActivityPersonsMinLabel.Name = "ActivityPersonsMinLabel";
            this.ActivityPersonsMinLabel.Size = new System.Drawing.Size(103, 19);
            this.ActivityPersonsMinLabel.TabIndex = 1;
            this.ActivityPersonsMinLabel.Text = "Počet osob min";
            // 
            // ActivityDescriptionLabel
            // 
            this.ActivityDescriptionLabel.AutoSize = true;
            this.ActivityDescriptionLabel.Location = new System.Drawing.Point(17, 63);
            this.ActivityDescriptionLabel.Name = "ActivityDescriptionLabel";
            this.ActivityDescriptionLabel.Size = new System.Drawing.Size(41, 19);
            this.ActivityDescriptionLabel.TabIndex = 1;
            this.ActivityDescriptionLabel.Text = "Popis";
            // 
            // ActivityNameLabel
            // 
            this.ActivityNameLabel.AutoSize = true;
            this.ActivityNameLabel.Location = new System.Drawing.Point(17, 31);
            this.ActivityNameLabel.Name = "ActivityNameLabel";
            this.ActivityNameLabel.Size = new System.Drawing.Size(46, 19);
            this.ActivityNameLabel.TabIndex = 1;
            this.ActivityNameLabel.Text = "Název";
            // 
            // AcitvitySave
            // 
            this.AcitvitySave.Location = new System.Drawing.Point(726, 374);
            this.AcitvitySave.Name = "AcitvitySave";
            this.AcitvitySave.Size = new System.Drawing.Size(97, 38);
            this.AcitvitySave.TabIndex = 0;
            this.AcitvitySave.Text = "Ulož";
            this.AcitvitySave.UseVisualStyleBackColor = true;
            this.AcitvitySave.Click += new System.EventHandler(this.AcitvitySave_Click);
            // 
            // Dashboard
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 19F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1843, 1124);
            this.Controls.Add(this.groupBox1);
            this.Controls.Add(this.SearchButton);
            this.Controls.Add(this.ActvityLabel);
            this.Controls.Add(this.ActivityListBox);
            this.Name = "Dashboard";
            this.Text = "Trénink";
            this.Load += new System.EventHandler(this.Dashboard_Load);
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityPicture)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityRatingUpDown)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityPersonsMaxUpDown)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityPersonsMinUpDown)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.ActivityDurationUpDown)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ListBox ActivityListBox;
        private System.Windows.Forms.Label ActvityLabel;
        private System.Windows.Forms.Button SearchButton;
        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.PictureBox ActivityPicture;
        private System.Windows.Forms.CheckedListBox ActivityAidsCheckBoxList;
        private System.Windows.Forms.CheckedListBox ActivityAimsCheckBoxList;
        private System.Windows.Forms.NumericUpDown ActivityRatingUpDown;
        private System.Windows.Forms.NumericUpDown ActivityPersonsMaxUpDown;
        private System.Windows.Forms.NumericUpDown ActivityPersonsMinUpDown;
        private System.Windows.Forms.NumericUpDown ActivityDurationUpDown;
        private System.Windows.Forms.TextBox ActivityDescriptionTextBox;
        private System.Windows.Forms.TextBox ActivityNameTextBox;
        private System.Windows.Forms.Label ActivityAidsLabel;
        private System.Windows.Forms.Label ActivityAimsLabel;
        private System.Windows.Forms.Label ActivityRatingLabel;
        private System.Windows.Forms.Label ActivityDurationLabel;
        private System.Windows.Forms.Label ActivityPictureLabel;
        private System.Windows.Forms.Label ActivityPersonsMaxLabel;
        private System.Windows.Forms.Label ActivityPersonsMinLabel;
        private System.Windows.Forms.Label ActivityDescriptionLabel;
        private System.Windows.Forms.Label ActivityNameLabel;
        private System.Windows.Forms.Button AcitvitySave;
    }
}

