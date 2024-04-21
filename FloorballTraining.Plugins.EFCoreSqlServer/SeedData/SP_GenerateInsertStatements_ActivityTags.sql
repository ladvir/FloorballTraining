USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_ActivityTags]    Script Date: 14.03.2024 12:44:58 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_ActivityTags]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	 @ActivityId int,
	 @TagId int
      

    DECLARE cur CURSOR for SELECT
	[Id]
	  ,[ActivityId]
      ,[TagId]
  FROM [dbo].[ActivityTags];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @ActivityId, @TagId;
	print 'SET IDENTITY_INSERT [dbo].[ActivityTags] ON;';
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print ' INSERT INTO [dbo].[ActivityTags]
           ([Id],[ActivityId]
           ,[TagId]) VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ',' + CAST(@ActivityId AS NVARCHAR(10)) 
			+ ',' + CAST(@TagId AS NVARCHAR(10)) 
			+');';		

        FETCH NEXT FROM cur INTO @Id, @ActivityId, @TagId;
    END;
	   print 'SET IDENTITY_INSERT [dbo].[ActivityTags] OFF;';
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

