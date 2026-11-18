from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0004_menuitem_discount_percentage'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='offer_active',
            field=models.BooleanField(default=False, help_text='Enable to show this dish as an active offer when dates/discount are valid.'),
        ),
        migrations.AddField(
            model_name='menuitem',
            name='offer_start_date',
            field=models.DateField(blank=True, null=True, help_text='Optional offer start date.'),
        ),
        migrations.AddField(
            model_name='menuitem',
            name='offer_end_date',
            field=models.DateField(blank=True, null=True, help_text='Optional offer expiry date.'),
        ),
    ]
