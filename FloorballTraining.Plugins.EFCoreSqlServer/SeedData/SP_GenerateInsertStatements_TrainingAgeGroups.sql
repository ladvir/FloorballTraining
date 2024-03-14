USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_TrainingAgeGroups]    Script Date: 14.03.2024 12:46:38 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_TrainingAgeGroups]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	 @TrainingId int,
	 @AgeGroupId int
      

    DECLARE cur CURSOR for SELECT
	[Id]
	  ,[TrainingId]
      ,[AgeGroupId]
  FROM [dbo].[TrainingAgeGroups];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @TrainingId, @AgeGroupId;
	 print 'SET IDENTITY_INSERT [dbo].[TrainingAgeGroups] ON;';
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print 'INSERT INTO [dbo].[TrainingAgeGroups]
           ([Id],[TrainingId]
           ,[AgeGroupId]) VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ',' + CAST(@TrainingId AS NVARCHAR(10)) 
			+ ',' + CAST(@AgeGroupId AS NVARCHAR(10)) 
			+');';		

        FETCH NEXT FROM cur INTO @Id, @TrainingId, @AgeGroupId;
    END;
	    print 'SET IDENTITY_INSERT [dbo].[TrainingAgeGroups] OFF;';
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

