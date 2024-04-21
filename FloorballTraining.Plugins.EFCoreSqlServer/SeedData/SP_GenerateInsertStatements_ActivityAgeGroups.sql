USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_ActivityAgeGroups]    Script Date: 14.03.2024 12:44:22 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_ActivityAgeGroups]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	 @ActivityId int,
	 @AgeGroupId int
      

    DECLARE cur CURSOR for SELECT
	[Id]
	  ,[ActivityId]
      ,[AgeGroupId]
  FROM [dbo].[ActivityAgeGroups];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @ActivityId, @AgeGroupId;
	print 'SET IDENTITY_INSERT [dbo].[ActivityAgeGroups] ON;'
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print ' INSERT INTO [dbo].[ActivityAgeGroups]
           ([Id],
		   [ActivityId]
           ,[AgeGroupId]) VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ',' + CAST(@ActivityId AS NVARCHAR(10)) 
			+ ',' + CAST(@AgeGroupId AS NVARCHAR(10)) 
			+');';		

        FETCH NEXT FROM cur INTO @Id, @ActivityId, @AgeGroupId;
    END;
		
		print 'SET IDENTITY_INSERT [dbo].[ActivityAgeGroups] OFF;'
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

