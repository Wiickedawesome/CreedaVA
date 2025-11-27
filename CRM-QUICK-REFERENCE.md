# CRM Quick Reference

## 🔑 Login & Access

**Login URL**: `https://www.creedava.com/login`
**Admin Dashboard**: `https://www.creedava.com/admin`

Default first user will be created when you sign up.

## 📱 Main Sections

### Dashboard (`/admin`)
- Overview of all CRM data
- Quick stats: leads, contacts, tasks, projects
- Recent activity feed

### Leads (`/admin/leads`)
- **New**: Just received, not yet contacted
- **Contacted**: Initial contact made
- **Qualified**: Verified as potential customer
- **Proposal**: Sent pricing/proposal
- **Negotiation**: Discussing terms
- **Won**: Converted to customer ✅
- **Lost**: Did not convert ❌

### Contacts (`/admin/contacts`)
- Customer database
- Tags for organization
- Notes and history
- Links to leads/projects

### Tasks (`/admin/tasks`)
- **Todo**: Not started
- **In Progress**: Currently working
- **Completed**: Finished ✅
- **Cancelled**: No longer needed ❌

**Priorities**:
- 🔴 Urgent
- 🟠 High
- 🟡 Medium
- 🟢 Low

### Projects (`/admin/projects`)
- **Planning**: Setting up
- **Active**: Currently working
- **On Hold**: Paused
- **Completed**: Finished ✅
- **Cancelled**: Stopped ❌

### Emails (`/admin/emails`)
- **Draft**: Not sent yet
- **Sent**: Delivered ✅
- **Failed**: Delivery error ❌

### SEO Content (`/admin/seo`)
Edit for each page:
- **Title**: Browser tab title (60 chars max)
- **Description**: Search result snippet (160 chars max)
- **Keywords**: Target search terms
- **OG Tags**: Social media sharing info
- **Canonical URL**: Primary page URL
- **Robots**: Search engine instructions

### Keywords (`/admin/keywords`)
Track rankings for:
- Target keywords
- Current position in Google
- Search volume
- Competition level

### Analytics (`/admin/analytics`)
View metrics:
- Page impressions
- Clicks from search
- Click-through rate (CTR)
- Average position
- Google Search Console data

### Settings (`/admin/settings`)
- User management
- Email templates
- API configurations
- General preferences

## 🎯 Common Workflows

### Adding a New Lead
1. Go to `/admin/leads`
2. Click "Add Lead"
3. Fill in: Name, Email, Phone, Company
4. Set Status: "New"
5. Assign to team member
6. Set follow-up date
7. Save

### Converting Lead to Contact
1. Update lead status to "Won"
2. Go to `/admin/contacts`
3. Click "Add Contact"
4. Link to the lead
5. Add full details
6. Save

### Creating a Task
1. Go to `/admin/tasks`
2. Click "Add Task"
3. Set title and description
4. Choose priority
5. Set due date
6. Assign to team member
7. Link to lead/contact/project (optional)
8. Save

### Updating SEO
1. Go to `/admin/seo`
2. Select page to edit
3. Update meta tags
4. Preview how it looks
5. Save changes
6. Changes go live on next deploy

### Tracking Keywords
1. Go to `/admin/keywords`
2. Click "Add Keyword"
3. Enter keyword phrase
4. Set target URL
5. System tracks position automatically
6. View charts and trends

## 🔄 Data Relationships

```
Lead → Contact (when won)
  ↓
Tasks (follow-ups)
  ↓
Project (if needed)
  ↓
More Tasks
```

## ⚡ Keyboard Shortcuts

(To be implemented)
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New item
- `Ctrl/Cmd + S`: Save
- `Esc`: Close modal

## 📊 Metrics to Watch

### Weekly
- New leads
- Lead conversion rate
- Tasks completed
- Email response rate

### Monthly
- Total customers
- SEO traffic growth
- Keyword ranking changes
- Project completion rate

## 🎨 Status Colors

- 🟢 Green: Good/Active/Won
- 🟡 Yellow: In Progress/Warning
- 🔴 Red: Urgent/Failed/Lost
- 🔵 Blue: New/Info
- ⚪ Gray: Inactive/Cancelled

## 💡 Tips

1. **Use Tags**: Organize contacts with tags like "VIP", "Follow-up", "Cold"
2. **Set Due Dates**: Always add due dates to tasks
3. **Add Notes**: Document all interactions
4. **Link Everything**: Connect leads to contacts to projects
5. **Update SEO Monthly**: Keep content fresh
6. **Track Keywords Weekly**: Monitor your rankings
7. **Review Analytics**: Check performance every week

## 🆘 Common Issues

**Can't see data?**
- Check you're logged in
- Verify internet connection
- Refresh the page

**Changes not saving?**
- Check all required fields filled
- Look for error messages
- Try again in a few seconds

**Forgot password?**
- Use "Forgot Password" link on login
- Check email for reset link

**Need to add user?**
- Go to Settings → Users
- Invite via email
- They sign up and get access

## 📞 Support Contacts

- Technical Issues: [your-email]
- Feature Requests: [your-email]
- Training: [your-email]

## 🚀 Getting Started Checklist

- [ ] Create admin account
- [ ] Set up email templates
- [ ] Import existing contacts
- [ ] Configure SEO for all pages
- [ ] Add keywords to track
- [ ] Create first project
- [ ] Assign tasks to team
- [ ] Review analytics
- [ ] Train team members
- [ ] Set weekly review meeting

---

**Version**: 1.0
**Last Updated**: November 2025
