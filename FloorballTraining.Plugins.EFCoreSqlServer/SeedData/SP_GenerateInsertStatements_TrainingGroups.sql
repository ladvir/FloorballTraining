USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_TrainingGroups]    Script Date: 14.03.2024 12:46:51 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_TrainingGroups]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	@PersonsMax INT, 
     @PersonsMin int,
      @ActivityId int,
      @TrainingPartId int

    DECLARE cur CURSOR for SELECT
            [Id],[PersonsMax]
      ,[PersonsMin]
      ,[ActivityId]
      ,[TrainingPartId]
  FROM [dbo].[TrainingGroups];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @PersonsMax, @PersonsMin, @ActivityId, @TrainingPartId;
	 print 'SET IDENTITY_INSERT [dbo].[TrainingGroups] ON;';
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print 'INSERT INTO [dbo].[TrainingGroups]
           ([Id],[PersonsMax]
           ,[PersonsMin]
           ,[ActivityId]
           ,[TrainingPartId]) VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ', ' + CAST(@PersonsMax AS NVARCHAR(10))
			+ ', ' + CAST(@PersonsMin AS NVARCHAR(10))
			+ ', ' + CAST(@ActivityId AS NVARCHAR(10))
			+ ', ' + CAST(@TrainingPartId AS NVARCHAR(10))			
			+');';		

        FETCH NEXT FROM cur INTO @Id, @PersonsMax, @PersonsMin, @ActivityId, @TrainingPartId;
    END;
	   	 print 'SET IDENTITY_INSERT [dbo].[TrainingGroups] OFF;';
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

