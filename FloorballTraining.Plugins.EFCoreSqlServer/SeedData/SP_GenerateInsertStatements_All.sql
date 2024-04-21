USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_All]    Script Date: 14.03.2024 12:45:35 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_All]

AS
BEGIN
    SET NOCOUNT ON;

    EXEC	[dbo].[GenerateInsertStatements_Tags] 
	EXEC	[dbo].[GenerateInsertStatements_Places] 
	EXEC	[dbo].[GenerateInsertStatements_Equipments] 
	EXEC	[dbo].[GenerateInsertStatements_AgeGroups] 

	EXEC	[dbo].[GenerateInsertStatements_Activities] 
	EXEC	[dbo].[GenerateInsertStatements_ActivityAgeGroups] 
	EXEC	[dbo].[GenerateInsertStatements_ActivityEquipments] 
	EXEC	[dbo].[GenerateInsertStatements_ActivityTags] 

	EXEC	[dbo].[GenerateInsertStatements_Trainings] 
	EXEC	[dbo].[GenerateInsertStatements_TrainingAgeGroups] 

	EXEC	[dbo].[GenerateInsertStatements_TrainingParts] 
	EXEC	[dbo].[GenerateInsertStatements_TrainingGroups] 

END;
GO

